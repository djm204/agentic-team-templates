# Blockchain Development Overview

Staff-level guidelines for blockchain and Web3 development, covering smart contracts, DeFi protocols, and decentralized applications.

## Scope

This template applies to:

- Smart contract development (Solidity, Vyper)
- DeFi protocols (AMMs, lending, yield strategies)
- Token implementations (ERC-20, ERC-721, ERC-1155, ERC-4626)
- Web3 frontend applications
- Cross-chain and L2 integrations

## Core Principles

### 1. Security Is Non-Negotiable

Smart contracts are immutable and handle real value. Every line of code is a potential attack vector.

- Assume all external inputs are malicious
- Follow checks-effects-interactions pattern religiously
- Get audited before mainnet deployment
- Start with OpenZeppelin; don't reinvent cryptographic wheels

### 2. Gas Efficiency Matters

Users pay for every operation. Respect their money.

- Optimize storage access patterns
- Use calldata over memory for read-only parameters
- Pack variables into storage slots
- Cache storage reads in memory during loops

### 3. Composability Is King

DeFi's power comes from protocol interoperability.

- Follow established standards (ERC-20, ERC-721, etc.)
- Design for integration, not isolation
- Document external interfaces thoroughly
- Consider how others will build on top of your contracts

### 4. Defense in Depth

No single security measure is sufficient.

- Multiple layers of access control
- Rate limiting and circuit breakers
- Monitoring and incident response plans
- Gradual rollouts with timelocks

## Project Structure

```
contracts/
├── src/                    # Contract source files
│   ├── core/              # Core protocol contracts
│   ├── periphery/         # Helper and router contracts
│   ├── interfaces/        # Interface definitions
│   ├── libraries/         # Shared libraries
│   └── tokens/            # Token implementations
├── test/                   # Test files
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   ├── invariant/         # Invariant/fuzz tests
│   └── fork/              # Mainnet fork tests
├── script/                 # Deployment scripts
├── lib/                    # External dependencies (git submodules)
└── foundry.toml           # Foundry configuration

frontend/
├── src/
│   ├── hooks/             # Web3 hooks (useContract, useBalance)
│   ├── providers/         # Wallet and chain providers
│   ├── contracts/         # ABIs and addresses
│   ├── utils/             # Web3 utilities
│   └── components/        # UI components
└── wagmi.config.ts        # Wagmi configuration
```

## Technology Stack

### Smart Contracts

- **Language**: Solidity 0.8.x (latest stable)
- **Framework**: Foundry (preferred) or Hardhat
- **Libraries**: OpenZeppelin Contracts
- **Testing**: Forge (unit, fuzz, invariant)
- **Static Analysis**: Slither, Mythril

### Web3 Frontend

- **Library**: Viem + Wagmi (React) or Ethers.js
- **Wallet Connection**: ConnectKit, RainbowKit, or custom
- **State Management**: React Query (via Wagmi)
- **Transaction Handling**: Optimistic updates with confirmation

### Infrastructure

- **RPC**: Alchemy, Infura, or self-hosted
- **Indexing**: The Graph or custom indexer
- **Monitoring**: Tenderly, OpenZeppelin Defender

## Definition of Done (Smart Contracts)

A smart contract is production-ready when:

- [ ] All functions have NatSpec documentation
- [ ] Unit tests cover all branches (>95% coverage)
- [ ] Fuzz tests for all external functions
- [ ] Invariant tests for protocol properties
- [ ] Slither reports zero high/medium findings
- [ ] Gas benchmarks documented
- [ ] Mainnet fork tests pass
- [ ] External audit completed (for mainnet)
- [ ] Deployment scripts tested on testnet
- [ ] Upgrade/migration path documented

## Definition of Done (Web3 Frontend)

A Web3 frontend feature is complete when:

- [ ] Works with multiple wallet types
- [ ] Handles transaction states (pending, confirmed, failed)
- [ ] Shows meaningful error messages
- [ ] Respects user's network preferences
- [ ] Works on mobile wallets
- [ ] Transaction simulations before signing
- [ ] Gas estimation displayed to user
