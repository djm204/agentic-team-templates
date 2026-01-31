# Smart Contract Testing

Comprehensive testing strategies using Foundry and best practices for contract verification.

## Testing Philosophy

1. **Test behavior, not implementation** - Focus on what the contract does
2. **100% branch coverage minimum** - Every code path tested
3. **Fuzz everything** - Random inputs catch edge cases humans miss
4. **Invariants are mandatory** - Properties that must always hold
5. **Fork tests for integrations** - Test against real protocols

## Foundry Test Structure

### Directory Organization

```
test/
├── unit/                  # Isolated function tests
│   ├── Vault.deposit.t.sol
│   ├── Vault.withdraw.t.sol
│   └── Vault.fees.t.sol
├── integration/           # Multi-contract tests
│   └── VaultWithOracle.t.sol
├── invariant/             # Invariant/stateful fuzz tests
│   ├── VaultInvariant.t.sol
│   └── handlers/
│       └── VaultHandler.sol
├── fork/                  # Mainnet fork tests
│   └── UniswapIntegration.t.sol
└── mocks/                 # Test doubles
    └── MockOracle.sol
```

### Basic Test Structure

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {Vault} from "src/Vault.sol";
import {MockERC20} from "test/mocks/MockERC20.sol";

contract VaultDepositTest is Test {
    // Contracts
    Vault public vault;
    MockERC20 public token;

    // Actors
    address public owner = makeAddr("owner");
    address public user = makeAddr("user");
    address public attacker = makeAddr("attacker");

    // Constants
    uint256 public constant INITIAL_BALANCE = 1000e18;

    function setUp() public {
        // Deploy contracts
        token = new MockERC20("Token", "TKN", 18);
        vault = new Vault(address(token));

        // Setup actors
        token.mint(user, INITIAL_BALANCE);
        vm.prank(user);
        token.approve(address(vault), type(uint256).max);
    }

    function test_deposit_success() public {
        uint256 amount = 100e18;

        vm.prank(user);
        vault.deposit(amount, user);

        assertEq(vault.balanceOf(user), amount);
        assertEq(token.balanceOf(address(vault)), amount);
    }

    function test_deposit_emitsEvent() public {
        uint256 amount = 100e18;

        vm.expectEmit(true, true, false, true);
        emit Vault.Deposited(user, amount);

        vm.prank(user);
        vault.deposit(amount, user);
    }

    function test_deposit_revertsOnZeroAmount() public {
        vm.expectRevert(Vault.ZeroAmount.selector);

        vm.prank(user);
        vault.deposit(0, user);
    }

    function test_deposit_revertsOnZeroAddress() public {
        vm.expectRevert(Vault.ZeroAddress.selector);

        vm.prank(user);
        vault.deposit(100e18, address(0));
    }
}
```

## Fuzz Testing

### Basic Fuzz Tests

```solidity
function testFuzz_deposit(uint256 amount) public {
    // Bound inputs to reasonable ranges
    amount = bound(amount, 1, INITIAL_BALANCE);

    vm.prank(user);
    vault.deposit(amount, user);

    assertEq(vault.balanceOf(user), amount);
}

function testFuzz_withdraw(uint256 depositAmount, uint256 withdrawAmount) public {
    depositAmount = bound(depositAmount, 1, INITIAL_BALANCE);
    withdrawAmount = bound(withdrawAmount, 1, depositAmount);

    // Setup
    vm.startPrank(user);
    vault.deposit(depositAmount, user);

    // Action
    vault.withdraw(withdrawAmount, user, user);
    vm.stopPrank();

    // Assert
    assertEq(vault.balanceOf(user), depositAmount - withdrawAmount);
}
```

### Fuzz Test with Assumptions

```solidity
function testFuzz_transfer(address to, uint256 amount) public {
    // Skip invalid addresses
    vm.assume(to != address(0));
    vm.assume(to != address(vault));
    vm.assume(to != user);

    amount = bound(amount, 1, INITIAL_BALANCE);

    // Deposit first
    vm.prank(user);
    vault.deposit(amount, user);

    // Transfer
    vm.prank(user);
    vault.transfer(to, amount);

    assertEq(vault.balanceOf(to), amount);
    assertEq(vault.balanceOf(user), 0);
}
```

## Invariant Testing

### Handler Contract

```solidity
// test/invariant/handlers/VaultHandler.sol
contract VaultHandler is Test {
    Vault public vault;
    MockERC20 public token;

    address[] public actors;
    address internal currentActor;

    // Ghost variables for tracking
    uint256 public ghost_totalDeposited;
    uint256 public ghost_totalWithdrawn;

    modifier useActor(uint256 actorSeed) {
        currentActor = actors[bound(actorSeed, 0, actors.length - 1)];
        vm.startPrank(currentActor);
        _;
        vm.stopPrank();
    }

    constructor(Vault _vault, MockERC20 _token) {
        vault = _vault;
        token = _token;

        // Create actors
        for (uint256 i = 0; i < 5; i++) {
            address actor = makeAddr(string(abi.encodePacked("actor", i)));
            actors.push(actor);
            token.mint(actor, 1000e18);
            vm.prank(actor);
            token.approve(address(vault), type(uint256).max);
        }
    }

    function deposit(uint256 actorSeed, uint256 amount) public useActor(actorSeed) {
        amount = bound(amount, 0, token.balanceOf(currentActor));
        if (amount == 0) return;

        vault.deposit(amount, currentActor);
        ghost_totalDeposited += amount;
    }

    function withdraw(uint256 actorSeed, uint256 amount) public useActor(actorSeed) {
        amount = bound(amount, 0, vault.balanceOf(currentActor));
        if (amount == 0) return;

        vault.withdraw(amount, currentActor, currentActor);
        ghost_totalWithdrawn += amount;
    }
}
```

### Invariant Test Contract

```solidity
// test/invariant/VaultInvariant.t.sol
contract VaultInvariantTest is Test {
    Vault public vault;
    MockERC20 public token;
    VaultHandler public handler;

    function setUp() public {
        token = new MockERC20("Token", "TKN", 18);
        vault = new Vault(address(token));
        handler = new VaultHandler(vault, token);

        // Target only the handler
        targetContract(address(handler));
    }

    // Invariant: Total assets >= total shares (no inflation)
    function invariant_noShareInflation() public view {
        assertGe(
            token.balanceOf(address(vault)),
            vault.totalSupply()
        );
    }

    // Invariant: Sum of balances == total supply
    function invariant_balancesMatchTotalSupply() public view {
        uint256 sum;
        address[] memory actors = handler.getActors();

        for (uint256 i = 0; i < actors.length; i++) {
            sum += vault.balanceOf(actors[i]);
        }

        assertEq(sum, vault.totalSupply());
    }

    // Invariant: Deposits - withdrawals == vault balance
    function invariant_depositWithdrawAccounting() public view {
        assertEq(
            handler.ghost_totalDeposited() - handler.ghost_totalWithdrawn(),
            token.balanceOf(address(vault))
        );
    }
}
```

## Fork Testing

### Setup Fork

```solidity
contract UniswapForkTest is Test {
    // Mainnet addresses
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant UNISWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;

    uint256 mainnetFork;

    function setUp() public {
        // Create fork at specific block for reproducibility
        mainnetFork = vm.createFork(vm.envString("ETH_RPC_URL"), 18_500_000);
        vm.selectFork(mainnetFork);
    }

    function test_swapOnUniswap() public {
        // Get some WETH
        deal(WETH, address(this), 10 ether);

        // Approve router
        IERC20(WETH).approve(UNISWAP_ROUTER, 10 ether);

        // Execute swap
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: WETH,
            tokenOut: USDC,
            fee: 3000,
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: 1 ether,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = ISwapRouter(UNISWAP_ROUTER).exactInputSingle(params);

        assertGt(amountOut, 0);
        assertGt(IERC20(USDC).balanceOf(address(this)), 0);
    }
}
```

## Testing Utilities

### Useful Cheatcodes

```solidity
// Time manipulation
vm.warp(block.timestamp + 1 days);  // Set timestamp
skip(1 hours);                       // Advance time

// Block manipulation
vm.roll(block.number + 100);        // Set block number

// Account manipulation
vm.prank(user);                     // Next call from user
vm.startPrank(user);                // All calls from user
vm.stopPrank();                     // Reset caller

// Balance manipulation
deal(address(token), user, 1000e18);  // Set ERC20 balance
deal(user, 100 ether);                 // Set ETH balance

// Expect revert
vm.expectRevert();                                    // Any revert
vm.expectRevert("Error message");                     // Specific message
vm.expectRevert(Contract.CustomError.selector);       // Custom error
vm.expectRevert(abi.encodeWithSelector(
    Contract.CustomError.selector, arg1, arg2
));  // Custom error with args

// Expect emit
vm.expectEmit(true, true, false, true);  // Check topics 1, 2, 4
emit ExpectedEvent(indexed1, indexed2, data);

// Snapshot/revert state
uint256 snapshot = vm.snapshot();
// ... make changes ...
vm.revertTo(snapshot);  // Restore state

// Labels for traces
vm.label(address(vault), "Vault");
vm.label(user, "User");
```

### Custom Assertions

```solidity
function assertApproxEq(
    uint256 a,
    uint256 b,
    uint256 maxDelta,
    string memory err
) internal {
    uint256 delta = a > b ? a - b : b - a;
    if (delta > maxDelta) {
        emit log_named_string("Error", err);
        emit log_named_uint("  Expected", b);
        emit log_named_uint("    Actual", a);
        emit log_named_uint("  MaxDelta", maxDelta);
        emit log_named_uint("    Delta", delta);
        fail();
    }
}

// Usage
assertApproxEq(actualShares, expectedShares, 1, "Shares mismatch");
```

## Running Tests

```bash
# Run all tests
forge test

# Run specific test file
forge test --match-path test/unit/Vault.deposit.t.sol

# Run specific test
forge test --match-test test_deposit_success

# Run with verbosity
forge test -vvvv  # Show traces

# Run with gas report
forge test --gas-report

# Run fork tests (requires RPC URL)
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/KEY forge test --match-path test/fork/

# Run invariant tests
forge test --match-path test/invariant/

# Coverage
forge coverage
forge coverage --report lcov
```

## Test Coverage Requirements

| Test Type | Coverage Target | Purpose |
|-----------|-----------------|---------|
| Unit | 100% branches | Verify individual functions |
| Fuzz | 10,000+ runs | Find edge cases |
| Invariant | 10,000+ calls | Verify system properties |
| Fork | Critical paths | Verify integrations |
| E2E | Happy paths | Verify user flows |
