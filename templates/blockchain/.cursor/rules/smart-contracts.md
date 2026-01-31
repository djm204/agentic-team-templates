# Smart Contract Development

Solidity patterns and best practices for secure, maintainable smart contracts.

## Solidity Style Guide

### File Structure

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// 1. Imports (interfaces first, then libraries, then contracts)
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// 2. Interfaces

// 3. Libraries

// 4. Contracts
contract MyContract is Ownable {
    // a. Type declarations (using, struct, enum)
    using SafeERC20 for IERC20;

    // b. State variables
    uint256 public constant MAX_SUPPLY = 1_000_000e18;
    uint256 private s_totalDeposits;
    mapping(address => uint256) private s_balances;

    // c. Events
    event Deposited(address indexed user, uint256 amount);

    // d. Errors
    error InsufficientBalance(uint256 requested, uint256 available);

    // e. Modifiers

    // f. Constructor

    // g. External functions

    // h. Public functions

    // i. Internal functions

    // j. Private functions

    // k. View/Pure functions
}
```

### Naming Conventions

```solidity
// Constants: SCREAMING_SNAKE_CASE
uint256 public constant MAX_FEE = 1000;

// Immutables: i_ prefix
address private immutable i_owner;

// Storage variables: s_ prefix
uint256 private s_totalSupply;
mapping(address => uint256) private s_balances;

// Function parameters: no prefix
function deposit(uint256 amount, address recipient) external;

// Local variables: no prefix
uint256 balance = s_balances[msg.sender];

// Events: PastTense
event Deposited(address indexed user, uint256 amount);
event FeeUpdated(uint256 oldFee, uint256 newFee);

// Errors: DescriptiveError
error InsufficientBalance(uint256 requested, uint256 available);
error Unauthorized(address caller);
```

## Security Patterns

### Checks-Effects-Interactions

Always follow this order to prevent reentrancy:

```solidity
// Good: CEI pattern
function withdraw(uint256 amount) external {
    // 1. CHECKS - Validate inputs and state
    if (s_balances[msg.sender] < amount) {
        revert InsufficientBalance(amount, s_balances[msg.sender]);
    }

    // 2. EFFECTS - Update state
    s_balances[msg.sender] -= amount;

    // 3. INTERACTIONS - External calls
    (bool success,) = msg.sender.call{value: amount}("");
    if (!success) revert TransferFailed();
}

// Bad: Reentrancy vulnerable
function withdrawBad(uint256 amount) external {
    require(s_balances[msg.sender] >= amount);
    (bool success,) = msg.sender.call{value: amount}("");  // External call first!
    require(success);
    s_balances[msg.sender] -= amount;  // State update after!
}
```

### Reentrancy Guards

Use for complex functions even with CEI:

```solidity
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Vault is ReentrancyGuard {
    function complexWithdraw(uint256 amount) external nonReentrant {
        // Safe from reentrancy even with multiple external calls
    }
}
```

### Access Control

```solidity
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract Protocol is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function emergencyPause() external onlyRole(ADMIN_ROLE) {
        // Only admins can pause
    }

    function processQueue() external onlyRole(OPERATOR_ROLE) {
        // Operators can process
    }
}
```

### Input Validation

```solidity
function deposit(address token, uint256 amount) external {
    // Validate address
    if (token == address(0)) revert ZeroAddress();

    // Validate amount
    if (amount == 0) revert ZeroAmount();

    // Validate token is allowed
    if (!s_allowedTokens[token]) revert TokenNotAllowed(token);

    // Validate limits
    if (amount > MAX_DEPOSIT) revert ExceedsMaxDeposit(amount, MAX_DEPOSIT);

    // Safe to proceed
    IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
}
```

## Common Patterns

### Pull Over Push

Prefer pull payments over push to avoid DoS:

```solidity
// Good: Pull pattern
mapping(address => uint256) private s_pendingWithdrawals;

function claimRewards() external {
    uint256 amount = s_pendingWithdrawals[msg.sender];
    if (amount == 0) revert NothingToClaim();

    s_pendingWithdrawals[msg.sender] = 0;
    IERC20(rewardToken).safeTransfer(msg.sender, amount);
}

// Bad: Push pattern (can be DoS'd)
function distributeRewards(address[] calldata recipients) external {
    for (uint256 i = 0; i < recipients.length; i++) {
        // If one transfer fails, all fail
        IERC20(rewardToken).safeTransfer(recipients[i], rewards[i]);
    }
}
```

### Emergency Stops

```solidity
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract Protocol is Pausable, Ownable {
    function deposit(uint256 amount) external whenNotPaused {
        // Normal operation
    }

    function withdraw(uint256 amount) external {
        // Withdrawals always work (no whenNotPaused)
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
```

### Timelock for Sensitive Operations

```solidity
uint256 public constant TIMELOCK_DURATION = 2 days;

struct PendingChange {
    uint256 value;
    uint256 executeAfter;
}

mapping(bytes32 => PendingChange) public pendingChanges;

function proposeFeeChange(uint256 newFee) external onlyOwner {
    bytes32 id = keccak256(abi.encode("FEE", newFee));
    pendingChanges[id] = PendingChange({
        value: newFee,
        executeAfter: block.timestamp + TIMELOCK_DURATION
    });
    emit FeeChangeProposed(newFee, block.timestamp + TIMELOCK_DURATION);
}

function executeFeeChange(uint256 newFee) external onlyOwner {
    bytes32 id = keccak256(abi.encode("FEE", newFee));
    PendingChange memory change = pendingChanges[id];

    if (change.executeAfter == 0) revert ChangeNotProposed();
    if (block.timestamp < change.executeAfter) revert TimelockNotExpired();

    delete pendingChanges[id];
    s_fee = newFee;
    emit FeeChanged(newFee);
}
```

## OpenZeppelin Contracts

### Recommended Imports

```solidity
// Tokens
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

// Security
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

// Access
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

// Utils
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// Upgradeable (use with caution)
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
```

## NatSpec Documentation

```solidity
/// @title Vault - A yield-bearing token vault
/// @author Protocol Team
/// @notice Allows users to deposit tokens and earn yield
/// @dev Implements ERC-4626 tokenized vault standard
contract Vault is ERC4626 {
    /// @notice Deposits assets and mints shares to receiver
    /// @dev Emits Deposit event
    /// @param assets Amount of underlying tokens to deposit
    /// @param receiver Address to receive the minted shares
    /// @return shares Amount of shares minted
    function deposit(uint256 assets, address receiver)
        public
        override
        returns (uint256 shares)
    {
        // Implementation
    }
}
```

## Anti-Patterns to Avoid

### Unchecked External Calls

```solidity
// Bad: Ignoring return value
token.transfer(recipient, amount);

// Good: Using SafeERC20
IERC20(token).safeTransfer(recipient, amount);

// Good: Checking return value explicitly
bool success = token.transfer(recipient, amount);
if (!success) revert TransferFailed();
```

### Unbounded Loops

```solidity
// Bad: Can run out of gas
function processAll() external {
    for (uint256 i = 0; i < users.length; i++) {
        processUser(users[i]);
    }
}

// Good: Paginated processing
function processBatch(uint256 start, uint256 count) external {
    uint256 end = Math.min(start + count, users.length);
    for (uint256 i = start; i < end; i++) {
        processUser(users[i]);
    }
}
```

### Floating Pragma

```solidity
// Bad: Any 0.8.x version
pragma solidity ^0.8.0;

// Good: Specific version
pragma solidity 0.8.20;
```

### Magic Numbers

```solidity
// Bad: Magic numbers
if (fee > 10000) revert();

// Good: Named constants
uint256 public constant MAX_FEE_BPS = 10_000; // 100%
uint256 public constant FEE_DENOMINATOR = 10_000;

if (fee > MAX_FEE_BPS) revert FeeExceedsMax(fee, MAX_FEE_BPS);
```
