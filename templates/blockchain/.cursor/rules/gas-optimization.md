# Gas Optimization

Patterns and techniques for writing gas-efficient smart contracts without sacrificing security.

## Storage Optimization

### Understanding Storage Costs

| Operation | Gas Cost |
|-----------|----------|
| SSTORE (0 → non-zero) | 20,000 |
| SSTORE (non-zero → non-zero) | 5,000 |
| SSTORE (non-zero → 0) | Refund 4,800 |
| SLOAD | 2,100 (cold) / 100 (warm) |
| Memory | 3 per word + expansion cost |
| Calldata | 4 per zero byte, 16 per non-zero |

### Variable Packing

Pack variables into 32-byte slots:

```solidity
// Bad: Uses 3 storage slots (96 bytes)
contract Unoptimized {
    uint256 public a;      // Slot 0 (32 bytes)
    uint128 public b;      // Slot 1 (16 bytes, wastes 16)
    uint128 public c;      // Slot 2 (16 bytes, wastes 16)
}

// Good: Uses 2 storage slots (64 bytes)
contract Optimized {
    uint256 public a;      // Slot 0 (32 bytes)
    uint128 public b;      // Slot 1 (16 bytes)
    uint128 public c;      // Slot 1 (16 bytes) - packed!
}

// Best: Pack related variables in structs
struct UserData {
    uint128 balance;       // 16 bytes
    uint64 lastUpdate;     // 8 bytes
    uint32 nonce;          // 4 bytes
    bool isActive;         // 1 byte
    // Total: 29 bytes, fits in one slot
}
```

### Storage Variable Caching

Cache storage reads in memory:

```solidity
// Bad: Multiple storage reads (~4,200 gas per iteration)
function sumBad() external view returns (uint256 total) {
    for (uint256 i = 0; i < s_values.length; i++) {
        total += s_values[i];
    }
}

// Good: Cache length, single write (~2,100 initial + ~100 per iteration)
function sumGood() external view returns (uint256 total) {
    uint256[] memory values = s_values;  // Cache in memory
    uint256 length = values.length;

    for (uint256 i = 0; i < length; i++) {
        total += values[i];
    }
}

// For single values
function processBad() external {
    for (uint256 i = 0; i < 10; i++) {
        s_counter += 1;  // 5,000 gas each write!
    }
}

function processGood() external {
    uint256 counter = s_counter;  // Read once
    for (uint256 i = 0; i < 10; i++) {
        counter += 1;  // Memory is cheap
    }
    s_counter = counter;  // Write once
}
```

## Memory vs Calldata

### Use Calldata for Read-Only Arrays

```solidity
// Bad: Copies data to memory (~3 gas per byte + overhead)
function processBad(uint256[] memory data) external {
    // data is copied from calldata to memory
}

// Good: Read directly from calldata (no copy)
function processGood(uint256[] calldata data) external {
    // data stays in calldata, read-only
}

// When you need to modify, use memory
function processAndModify(uint256[] calldata data) external returns (uint256[] memory) {
    uint256[] memory result = new uint256[](data.length);
    for (uint256 i = 0; i < data.length; i++) {
        result[i] = data[i] * 2;
    }
    return result;
}
```

### String/Bytes Parameters

```solidity
// Bad
function setNameBad(string memory name) external {
    s_name = name;
}

// Good: Use calldata if not modifying
function setNameGood(string calldata name) external {
    s_name = name;
}
```

## Loop Optimizations

### Increment Patterns

```solidity
// Bad: Post-increment creates temporary variable
for (uint256 i = 0; i < length; i++) { }

// Good: Pre-increment (saves ~5 gas per iteration)
for (uint256 i = 0; i < length; ++i) { }

// Best: Unchecked increment when overflow is impossible
for (uint256 i = 0; i < length;) {
    // loop body
    unchecked { ++i; }
}
```

### Avoid Redundant Checks

```solidity
// Bad: Bounds check on every access
function sumArray(uint256[] calldata arr) external pure returns (uint256 sum) {
    for (uint256 i = 0; i < arr.length; ++i) {
        sum += arr[i];  // Bounds check each time
    }
}

// Good: Assembly for direct access (use with caution!)
function sumArrayOptimized(uint256[] calldata arr) external pure returns (uint256 sum) {
    assembly {
        let length := arr.length
        let offset := arr.offset

        for { let i := 0 } lt(i, length) { i := add(i, 1) } {
            sum := add(sum, calldataload(add(offset, mul(i, 32))))
        }
    }
}
```

## Function Optimizations

### Visibility Matters

```solidity
// External is cheaper than public for array parameters
function processBad(uint256[] memory data) public { }      // Copies to memory
function processGood(uint256[] calldata data) external { } // No copy

// Use external when function is only called externally
function externalOnly() external { }  // Cheaper
function publicFunc() public { }       // Can be called internally too
```

### Short-Circuit Evaluation

```solidity
// Put cheaper/more likely to fail checks first
function validateBad(address user, uint256 amount) external view {
    require(complexCheck(amount), "Complex failed");  // Expensive first
    require(user != address(0), "Zero address");       // Cheap second
}

function validateGood(address user, uint256 amount) external view {
    require(user != address(0), "Zero address");       // Cheap first
    require(complexCheck(amount), "Complex failed");  // Expensive second
}
```

### Custom Errors vs Require Strings

```solidity
// Bad: String storage is expensive
require(balance >= amount, "Insufficient balance");

// Good: Custom errors are cheaper and more informative
error InsufficientBalance(uint256 requested, uint256 available);

if (balance < amount) {
    revert InsufficientBalance(amount, balance);
}
```

## Bit Manipulation

### Packing Booleans

```solidity
// Bad: Each bool uses full storage slot
bool public flag1;
bool public flag2;
bool public flag3;

// Good: Pack into single uint256
uint256 private s_flags;

uint256 private constant FLAG1 = 1 << 0;  // 0x01
uint256 private constant FLAG2 = 1 << 1;  // 0x02
uint256 private constant FLAG3 = 1 << 2;  // 0x04

function setFlag1(bool value) external {
    if (value) {
        s_flags |= FLAG1;   // Set bit
    } else {
        s_flags &= ~FLAG1;  // Clear bit
    }
}

function getFlag1() external view returns (bool) {
    return s_flags & FLAG1 != 0;
}
```

### Efficient Division/Multiplication

```solidity
// Division by powers of 2
uint256 half = value / 2;      // ~5 gas
uint256 halfOpt = value >> 1;  // ~3 gas

// Multiplication by powers of 2
uint256 doubled = value * 2;      // ~5 gas
uint256 doubledOpt = value << 1;  // ~3 gas

// But only when overflow is handled!
```

## Constants and Immutables

```solidity
// Bad: Storage variable (2,100 gas to read)
address public owner;

// Good: Immutable (embedded in bytecode, ~3 gas)
address public immutable i_owner;

// Best: Constant (replaced at compile time, ~3 gas)
uint256 public constant MAX_SUPPLY = 1_000_000e18;

constructor(address _owner) {
    i_owner = _owner;  // Set once, never changes
}
```

## Batching Operations

```solidity
// Bad: Multiple transactions
function transferOne(address to, uint256 amount) external {
    _transfer(msg.sender, to, amount);
}

// Good: Batch in single transaction
function transferBatch(
    address[] calldata recipients,
    uint256[] calldata amounts
) external {
    uint256 length = recipients.length;
    require(length == amounts.length, "Length mismatch");

    for (uint256 i = 0; i < length;) {
        _transfer(msg.sender, recipients[i], amounts[i]);
        unchecked { ++i; }
    }
}
```

## Gas Benchmarking

### Foundry Gas Reports

```bash
# Run tests with gas report
forge test --gas-report

# Compare before/after optimization
forge snapshot
# Make changes
forge snapshot --diff
```

### Manual Measurement

```solidity
function testGasUsage() public {
    uint256 gasBefore = gasleft();

    // Operation to measure
    contract.someFunction();

    uint256 gasUsed = gasBefore - gasleft();
    console.log("Gas used:", gasUsed);
}
```

## When NOT to Optimize

1. **Security**: Never sacrifice security for gas savings
2. **Readability**: Heavily optimized code is harder to audit
3. **Maintenance**: Complex optimizations create technical debt
4. **Premature**: Optimize after profiling, not before

```solidity
// Readable and secure > slightly cheaper
// This is fine even if not perfectly optimized
function transfer(address to, uint256 amount) external {
    require(to != address(0), "Zero address");
    require(s_balances[msg.sender] >= amount, "Insufficient balance");

    s_balances[msg.sender] -= amount;
    s_balances[to] += amount;

    emit Transfer(msg.sender, to, amount);
}
```
