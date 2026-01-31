# DeFi Protocol Patterns

Advanced patterns for building DeFi protocols: AMMs, lending, yield strategies, and MEV protection.

## Token Standards

### ERC-20 (Fungible Tokens)

```solidity
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("My Token", "MTK") {
        _mint(msg.sender, 1_000_000e18);
    }
}

// With extensions
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract AdvancedToken is ERC20, ERC20Burnable, ERC20Pausable, ERC20Permit {
    // Permit allows gasless approvals via signatures
}
```

### ERC-721 (NFTs)

```solidity
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MyNFT is ERC721, ERC721URIStorage {
    uint256 private s_tokenIdCounter;

    constructor() ERC721("My NFT", "MNFT") {}

    function mint(address to, string memory uri) external {
        uint256 tokenId = s_tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }
}
```

### ERC-1155 (Multi-Token)

```solidity
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract GameItems is ERC1155 {
    uint256 public constant GOLD = 0;
    uint256 public constant SILVER = 1;
    uint256 public constant SWORD = 2;
    uint256 public constant SHIELD = 3;

    constructor() ERC1155("https://game.example/api/item/{id}.json") {
        _mint(msg.sender, GOLD, 10**18, "");
        _mint(msg.sender, SILVER, 10**27, "");
        _mint(msg.sender, SWORD, 100, "");
        _mint(msg.sender, SHIELD, 50, "");
    }
}
```

### ERC-4626 (Tokenized Vaults)

The standard for yield-bearing tokens:

```solidity
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract YieldVault is ERC4626 {
    constructor(IERC20 asset_)
        ERC4626(asset_)
        ERC20("Yield Vault Token", "yVLT")
    {}

    // Override to implement yield strategy
    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this)) + _accruedYield();
    }

    function _accruedYield() internal view returns (uint256) {
        // Calculate yield from strategy
    }
}
```

## AMM Patterns

### Constant Product Market Maker (x * y = k)

```solidity
contract SimpleAMM {
    IERC20 public immutable token0;
    IERC20 public immutable token1;

    uint256 public reserve0;
    uint256 public reserve1;

    uint256 private constant FEE_BPS = 30;  // 0.3%
    uint256 private constant BPS = 10_000;

    event Swap(
        address indexed sender,
        uint256 amountIn,
        uint256 amountOut,
        bool zeroForOne
    );

    function swap(uint256 amountIn, bool zeroForOne, uint256 minAmountOut)
        external
        returns (uint256 amountOut)
    {
        (IERC20 tokenIn, IERC20 tokenOut, uint256 reserveIn, uint256 reserveOut) =
            zeroForOne
                ? (token0, token1, reserve0, reserve1)
                : (token1, token0, reserve1, reserve0);

        // Transfer in
        tokenIn.transferFrom(msg.sender, address(this), amountIn);

        // Calculate output: dy = (dx * y * (1 - fee)) / (x + dx * (1 - fee))
        uint256 amountInWithFee = amountIn * (BPS - FEE_BPS);
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * BPS + amountInWithFee);

        // Slippage protection
        if (amountOut < minAmountOut) revert SlippageExceeded();

        // Update reserves
        if (zeroForOne) {
            reserve0 += amountIn;
            reserve1 -= amountOut;
        } else {
            reserve1 += amountIn;
            reserve0 -= amountOut;
        }

        // Transfer out
        tokenOut.transfer(msg.sender, amountOut);

        emit Swap(msg.sender, amountIn, amountOut, zeroForOne);
    }

    function addLiquidity(uint256 amount0, uint256 amount1) external returns (uint256 liquidity) {
        // Implementation...
    }
}
```

### Price Calculation

```solidity
// Get current spot price
function getSpotPrice() public view returns (uint256) {
    return (reserve1 * 1e18) / reserve0;
}

// Get output amount for input
function getAmountOut(uint256 amountIn, bool zeroForOne) public view returns (uint256) {
    (uint256 reserveIn, uint256 reserveOut) = zeroForOne
        ? (reserve0, reserve1)
        : (reserve1, reserve0);

    uint256 amountInWithFee = amountIn * (BPS - FEE_BPS);
    return (amountInWithFee * reserveOut) / (reserveIn * BPS + amountInWithFee);
}
```

## Flash Loans (ERC-3156)

### Flash Loan Lender

```solidity
import {IERC3156FlashLender} from "@openzeppelin/contracts/interfaces/IERC3156FlashLender.sol";
import {IERC3156FlashBorrower} from "@openzeppelin/contracts/interfaces/IERC3156FlashBorrower.sol";

contract FlashLender is IERC3156FlashLender {
    bytes32 private constant CALLBACK_SUCCESS = keccak256("ERC3156FlashBorrower.onFlashLoan");

    uint256 public constant FEE_BPS = 9;  // 0.09%

    mapping(address => bool) public supportedTokens;

    function flashLoan(
        IERC3156FlashBorrower receiver,
        address token,
        uint256 amount,
        bytes calldata data
    ) external returns (bool) {
        if (!supportedTokens[token]) revert UnsupportedToken();

        uint256 fee = flashFee(token, amount);
        uint256 balanceBefore = IERC20(token).balanceOf(address(this));

        // Lend
        IERC20(token).transfer(address(receiver), amount);

        // Callback
        if (receiver.onFlashLoan(msg.sender, token, amount, fee, data) != CALLBACK_SUCCESS) {
            revert CallbackFailed();
        }

        // Verify repayment
        uint256 balanceAfter = IERC20(token).balanceOf(address(this));
        if (balanceAfter < balanceBefore + fee) {
            revert RepaymentFailed();
        }

        return true;
    }

    function flashFee(address token, uint256 amount) public view returns (uint256) {
        return (amount * FEE_BPS) / 10_000;
    }

    function maxFlashLoan(address token) public view returns (uint256) {
        return supportedTokens[token] ? IERC20(token).balanceOf(address(this)) : 0;
    }
}
```

### Flash Loan Borrower

```solidity
contract FlashBorrower is IERC3156FlashBorrower {
    IERC3156FlashLender public lender;

    function onFlashLoan(
        address initiator,
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external returns (bytes32) {
        require(msg.sender == address(lender), "Untrusted lender");
        require(initiator == address(this), "Untrusted initiator");

        // Do something with the flash loan
        // e.g., arbitrage, liquidation, collateral swap

        // Repay
        IERC20(token).approve(address(lender), amount + fee);

        return keccak256("ERC3156FlashBorrower.onFlashLoan");
    }

    function executeFlashLoan(address token, uint256 amount) external {
        lender.flashLoan(this, token, amount, "");
    }
}
```

## MEV Protection

### Commit-Reveal Pattern

```solidity
contract CommitRevealAuction {
    struct Bid {
        bytes32 commitment;
        uint256 revealedAmount;
        bool revealed;
    }

    mapping(address => Bid) public bids;
    uint256 public commitDeadline;
    uint256 public revealDeadline;

    // Phase 1: Commit (hidden bid)
    function commit(bytes32 commitment) external {
        require(block.timestamp < commitDeadline, "Commit phase ended");
        bids[msg.sender].commitment = commitment;
    }

    // Phase 2: Reveal
    function reveal(uint256 amount, bytes32 salt) external {
        require(block.timestamp >= commitDeadline, "Commit phase not ended");
        require(block.timestamp < revealDeadline, "Reveal phase ended");

        Bid storage bid = bids[msg.sender];
        bytes32 expectedCommitment = keccak256(abi.encode(msg.sender, amount, salt));

        require(bid.commitment == expectedCommitment, "Invalid reveal");

        bid.revealedAmount = amount;
        bid.revealed = true;
    }
}
```

### Slippage Protection

```solidity
function swap(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 minAmountOut,  // User-specified minimum
    uint256 deadline       // Transaction expiry
) external {
    // Deadline check - prevents stale transactions
    if (block.timestamp > deadline) revert TransactionExpired();

    uint256 amountOut = _calculateAmountOut(tokenIn, tokenOut, amountIn);

    // Slippage check - prevents sandwich attacks
    if (amountOut < minAmountOut) revert SlippageExceeded(amountOut, minAmountOut);

    _executeSwap(tokenIn, tokenOut, amountIn, amountOut);
}
```

### Private Mempools

For sensitive transactions, use private transaction services:

```typescript
// Frontend: Submit to Flashbots Protect
const flashbotsProvider = new ethers.providers.JsonRpcProvider(
  'https://rpc.flashbots.net'
);

// Transaction won't be visible in public mempool
const tx = await flashbotsProvider.sendTransaction(signedTx);
```

## Oracle Integration

### Chainlink Price Feeds

```solidity
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceConsumer {
    AggregatorV3Interface internal priceFeed;

    constructor(address feedAddress) {
        priceFeed = AggregatorV3Interface(feedAddress);
    }

    function getLatestPrice() public view returns (int256 price, uint256 timestamp) {
        (
            /* uint80 roundID */,
            price,
            /* uint256 startedAt */,
            timestamp,
            /* uint80 answeredInRound */
        ) = priceFeed.latestRoundData();

        // Staleness check
        if (block.timestamp - timestamp > 1 hours) {
            revert StalePrice();
        }

        // Sanity check
        if (price <= 0) {
            revert InvalidPrice();
        }

        return (price, timestamp);
    }
}
```

### TWAP (Time-Weighted Average Price)

```solidity
// Uniswap V3 TWAP
import {OracleLibrary} from "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";

function getTwapPrice(address pool, uint32 twapInterval) public view returns (uint256) {
    (int24 arithmeticMeanTick,) = OracleLibrary.consult(pool, twapInterval);

    uint160 sqrtPriceX96 = TickMath.getSqrtRatioAtTick(arithmeticMeanTick);

    // Convert to price
    return uint256(sqrtPriceX96) ** 2 / (2 ** 192);
}
```

## Yield Strategies

### Basic Yield Aggregator

```solidity
contract YieldAggregator is ERC4626 {
    struct Strategy {
        address target;
        uint256 allocation;  // In BPS
        bool active;
    }

    Strategy[] public strategies;
    uint256 public constant TOTAL_BPS = 10_000;

    function harvest() external {
        uint256 totalYield;

        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i].active) {
                uint256 yield = IStrategy(strategies[i].target).harvest();
                totalYield += yield;
            }
        }

        // Compound or distribute
    }

    function rebalance() external {
        uint256 totalAssets_ = totalAssets();

        for (uint256 i = 0; i < strategies.length; i++) {
            Strategy memory strat = strategies[i];
            if (!strat.active) continue;

            uint256 targetAllocation = (totalAssets_ * strat.allocation) / TOTAL_BPS;
            uint256 currentAllocation = IStrategy(strat.target).balance();

            if (currentAllocation < targetAllocation) {
                // Deposit more
                uint256 delta = targetAllocation - currentAllocation;
                IStrategy(strat.target).deposit(delta);
            } else if (currentAllocation > targetAllocation) {
                // Withdraw excess
                uint256 delta = currentAllocation - targetAllocation;
                IStrategy(strat.target).withdraw(delta);
            }
        }
    }
}
```

## Liquidation Patterns

```solidity
contract LendingProtocol {
    struct Position {
        uint256 collateral;
        uint256 debt;
    }

    uint256 public constant LIQUIDATION_THRESHOLD = 8000;  // 80%
    uint256 public constant LIQUIDATION_BONUS = 500;       // 5%

    function isLiquidatable(address user) public view returns (bool) {
        Position memory pos = positions[user];
        uint256 collateralValue = getCollateralValue(pos.collateral);
        uint256 debtValue = getDebtValue(pos.debt);

        // Health factor = collateral * threshold / debt
        return (collateralValue * LIQUIDATION_THRESHOLD / 10_000) < debtValue;
    }

    function liquidate(address user, uint256 debtToCover) external {
        require(isLiquidatable(user), "Not liquidatable");

        Position storage pos = positions[user];

        // Calculate collateral to seize (debt + bonus)
        uint256 collateralToSeize = (debtToCover * (10_000 + LIQUIDATION_BONUS)) / 10_000;
        collateralToSeize = collateralToSeize * debtPrice / collateralPrice;

        // Cap at user's collateral
        if (collateralToSeize > pos.collateral) {
            collateralToSeize = pos.collateral;
        }

        // Update position
        pos.debt -= debtToCover;
        pos.collateral -= collateralToSeize;

        // Transfer
        debtToken.transferFrom(msg.sender, address(this), debtToCover);
        collateralToken.transfer(msg.sender, collateralToSeize);

        emit Liquidation(user, msg.sender, debtToCover, collateralToSeize);
    }
}
```

## Anti-Patterns to Avoid

### 1. On-Chain Price Manipulation

```solidity
// Bad: Using spot price from AMM
uint256 price = amm.getSpotPrice();  // Can be manipulated in same tx

// Good: Use TWAP or Chainlink
uint256 price = oracle.getTwapPrice(1 hours);
```

### 2. Unprotected External Calls

```solidity
// Bad: No validation of external protocol
IExternalProtocol(untrustedAddress).deposit(amount);

// Good: Whitelist and validate
require(trustedProtocols[protocol], "Untrusted protocol");
IExternalProtocol(protocol).deposit(amount);
```

### 3. Lack of Emergency Controls

```solidity
// Good: Emergency withdraw capability
function emergencyWithdraw() external onlyOwner {
    _pause();
    // Withdraw all funds from strategies
    for (uint256 i = 0; i < strategies.length; i++) {
        IStrategy(strategies[i]).withdrawAll();
    }
}
```
