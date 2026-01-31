# Smart Contract Security

Comprehensive security guidelines covering attack vectors, defense patterns, and audit preparation.

## Common Attack Vectors

### Reentrancy

**Vulnerability**: External calls allow malicious contracts to re-enter your function before state updates complete.

```solidity
// Vulnerable
function withdraw() external {
    uint256 balance = balances[msg.sender];
    (bool success,) = msg.sender.call{value: balance}("");  // Attacker re-enters here
    require(success);
    balances[msg.sender] = 0;  // Too late!
}

// Secure: CEI + ReentrancyGuard
function withdraw() external nonReentrant {
    uint256 balance = balances[msg.sender];
    balances[msg.sender] = 0;  // State update first
    (bool success,) = msg.sender.call{value: balance}("");
    if (!success) revert TransferFailed();
}
```

### Flash Loan Attacks

**Vulnerability**: On-chain price oracles can be manipulated within a single transaction.

```solidity
// Vulnerable: Using spot price
function getCollateralValue(address user) public view returns (uint256) {
    uint256 tokenBalance = collateral[user];
    uint256 spotPrice = amm.getSpotPrice();  // Can be manipulated!
    return tokenBalance * spotPrice;
}

// Secure: Time-weighted average price (TWAP)
function getCollateralValue(address user) public view returns (uint256) {
    uint256 tokenBalance = collateral[user];
    uint256 twapPrice = oracle.getTwapPrice(1 hours);  // Resistant to manipulation
    return tokenBalance * twapPrice;
}
```

### Front-Running / MEV

**Vulnerability**: Transactions in the mempool can be observed and exploited.

**Defenses**:

```solidity
// Commit-reveal for sensitive operations
mapping(bytes32 => uint256) public commits;

function commit(bytes32 hash) external {
    commits[hash] = block.timestamp;
}

function reveal(uint256 value, bytes32 salt) external {
    bytes32 hash = keccak256(abi.encode(msg.sender, value, salt));
    if (commits[hash] == 0) revert NotCommitted();
    if (block.timestamp < commits[hash] + MIN_DELAY) revert TooEarly();

    delete commits[hash];
    // Execute with revealed value
}

// Slippage protection
function swap(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 minAmountOut,  // User specifies minimum acceptable output
    uint256 deadline       // Transaction expires
) external {
    if (block.timestamp > deadline) revert Expired();

    uint256 amountOut = _executeSwap(tokenIn, tokenOut, amountIn);
    if (amountOut < minAmountOut) revert SlippageExceeded();

    // Transfer tokens
}
```

### Integer Overflow/Underflow

Solidity 0.8+ has built-in checks, but be aware of `unchecked` blocks:

```solidity
// Safe by default in 0.8+
uint256 a = type(uint256).max;
uint256 b = a + 1;  // Reverts

// Dangerous: unchecked arithmetic
unchecked {
    uint256 c = a + 1;  // Wraps to 0!
}

// Only use unchecked when you've proven overflow is impossible
function incrementCounter() external {
    unchecked {
        // Safe because we check first
        if (counter >= type(uint256).max) revert CounterOverflow();
        counter++;
    }
}
```

### Access Control Bypass

```solidity
// Vulnerable: tx.origin
function withdraw() external {
    require(tx.origin == owner);  // Can be bypassed via phishing!
}

// Secure: msg.sender
function withdraw() external {
    require(msg.sender == owner);
}

// Even better: Role-based access control
function withdraw() external onlyRole(ADMIN_ROLE) {
    // Only admins can call
}
```

### Denial of Service

```solidity
// Vulnerable: Unbounded loop
function distributeRewards() external {
    for (uint256 i = 0; i < recipients.length; i++) {
        payable(recipients[i]).transfer(rewards[i]);  // One failure stops all
    }
}

// Secure: Pull pattern with pagination
function claimReward() external {
    uint256 reward = pendingRewards[msg.sender];
    if (reward == 0) revert NoReward();

    pendingRewards[msg.sender] = 0;
    (bool success,) = msg.sender.call{value: reward}("");
    if (!success) revert TransferFailed();
}
```

### Storage Collision (Upgradeable Contracts)

```solidity
// Vulnerable: Adding variables incorrectly
contract V1 {
    uint256 public value;      // Slot 0
}

contract V2 is V1 {
    address public newAdmin;   // Slot 1
    uint256 public newValue;   // Slot 2
}

// If you add a variable in the middle, it corrupts storage!
contract V2Bad is V1 {
    uint256 public newValue;   // Slot 1 - OVERWRITES existing data!
    address public newAdmin;   // Slot 2
}

// Secure: Storage gaps
contract V1 {
    uint256 public value;
    uint256[49] private __gap;  // Reserve slots for future use
}
```

## Security Checklist

### Before Writing Code

- [ ] Threat model documented
- [ ] Attack vectors identified
- [ ] Trust assumptions explicit
- [ ] Upgrade strategy decided

### During Development

- [ ] Checks-Effects-Interactions pattern
- [ ] Reentrancy guards on state-changing functions
- [ ] Input validation on all external functions
- [ ] Access control on sensitive functions
- [ ] Events emitted for all state changes
- [ ] No floating pragma
- [ ] No assembly without documentation
- [ ] No `tx.origin` for authentication
- [ ] No `selfdestruct` unless absolutely necessary

### Before Deployment

- [ ] Slither reports zero high/medium findings
- [ ] Mythril analysis complete
- [ ] Fuzz tests with >100k runs
- [ ] Mainnet fork tests pass
- [ ] External audit completed
- [ ] Bug bounty program ready

### After Deployment

- [ ] Monitoring alerts configured
- [ ] Incident response plan documented
- [ ] Admin keys secured (multisig, hardware wallet)
- [ ] Gradual rollout (testnet → limited mainnet → full)

## Secure Development Workflow

### 1. Static Analysis

Run on every commit:

```bash
# Slither - detects 40+ vulnerability patterns
slither . --exclude-dependencies

# Mythril - symbolic execution
myth analyze contracts/MyContract.sol
```

### 2. Invariant Testing

Define properties that must always hold:

```solidity
// test/invariant/VaultInvariant.t.sol
function invariant_totalSharesMatchesDeposits() public {
    uint256 totalAssets = vault.totalAssets();
    uint256 totalShares = vault.totalSupply();

    // Total shares should always be <= total assets (no inflation)
    assert(totalShares <= totalAssets + 1);  // +1 for rounding
}

function invariant_noFreeShares() public {
    // Can't get shares without depositing
    assert(vault.balanceOf(attacker) == 0 || deposits[attacker] > 0);
}
```

### 3. Fuzz Testing

```solidity
function testFuzz_deposit(uint256 amount) public {
    amount = bound(amount, 1, type(uint96).max);  // Reasonable bounds

    token.mint(user, amount);
    vm.startPrank(user);
    token.approve(address(vault), amount);

    uint256 sharesBefore = vault.balanceOf(user);
    vault.deposit(amount, user);
    uint256 sharesAfter = vault.balanceOf(user);

    assertGt(sharesAfter, sharesBefore);
}
```

### 4. Mainnet Fork Testing

```solidity
function testFork_integrationWithUniswap() public {
    // Fork mainnet at specific block
    vm.createSelectFork(vm.envString("ETH_RPC_URL"), 18_000_000);

    // Test against real Uniswap contracts
    IUniswapV3Router router = IUniswapV3Router(UNISWAP_ROUTER);
    // ... test integration
}
```

## Audit Preparation

### Documentation Required

1. **System Overview**: Architecture diagram, trust assumptions
2. **Contract Descriptions**: Purpose of each contract
3. **External Interactions**: All protocols you integrate with
4. **Access Control Matrix**: Who can call what
5. **Known Issues**: Things you've accepted as tradeoffs
6. **Test Coverage Report**: What's tested, what's not

### Code Organization

```
docs/
├── architecture.md       # System design
├── threat-model.md       # Security assumptions
├── access-control.md     # Roles and permissions
└── deployment.md         # Deploy process

contracts/
├── src/                  # Clean, well-documented code
├── test/                 # Comprehensive tests
└── script/               # Deployment scripts
```

### Common Audit Findings to Pre-Check

1. Missing zero-address checks
2. Missing input validation
3. Centralization risks (admin keys)
4. Lack of events for state changes
5. Inconsistent error handling
6. Missing NatSpec documentation
7. Unused code/imports
8. Hardcoded addresses
9. Missing reentrancy protection
10. Unsafe external calls
