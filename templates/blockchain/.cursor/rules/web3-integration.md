# Web3 Frontend Integration

Patterns for building secure, user-friendly Web3 frontends using modern tooling.

## Technology Stack

### Recommended Stack (2025)

| Layer | Technology | Purpose |
|-------|------------|---------|
| Ethereum Interface | Viem | Low-level, type-safe RPC client |
| React Hooks | Wagmi | React hooks for wallet/chain interaction |
| Wallet Connection | ConnectKit/RainbowKit | Pre-built wallet UIs |
| State Management | React Query (via Wagmi) | Caching and synchronization |
| Type Generation | wagmi cli | Generate types from ABIs |

### Project Setup

```bash
npm install wagmi viem @tanstack/react-query
npm install connectkit  # or rainbowkit
```

## Configuration

### Wagmi Config

```typescript
// lib/wagmi.ts
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, arbitrum } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, arbitrum, sepolia],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'My App' }),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID! }),
  ],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC),
    [arbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC),
  },
});
```

### Provider Setup

```typescript
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { ConnectKitProvider } from 'connectkit';
import { config } from '@/lib/wagmi';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

## Wallet Connection

### Basic Connection

```typescript
// components/ConnectButton.tsx
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div>
        <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  return (
    <div>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          disabled={isPending}
        >
          {connector.name}
        </button>
      ))}
    </div>
  );
}
```

### Using ConnectKit (Recommended)

```typescript
import { ConnectKitButton } from 'connectkit';

export function Header() {
  return (
    <header>
      <ConnectKitButton />
    </header>
  );
}
```

## Contract Interactions

### Type-Safe Contract Hooks

```typescript
// hooks/useVault.ts
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { vaultAbi } from '@/contracts/abi';

const VAULT_ADDRESS = '0x...' as const;

export function useVaultBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

export function useVaultDeposit() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = async (amount: string) => {
    writeContract({
      address: VAULT_ADDRESS,
      abi: vaultAbi,
      functionName: 'deposit',
      args: [parseEther(amount)],
    });
  };

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
```

### Using the Hook

```typescript
// components/DepositForm.tsx
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useVaultDeposit, useVaultBalance } from '@/hooks/useVault';

export function DepositForm() {
  const [amount, setAmount] = useState('');
  const { address } = useAccount();
  const { data: balance } = useVaultBalance(address);
  const { deposit, isPending, isConfirming, isSuccess, error } = useVaultDeposit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    deposit(amount);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount in ETH"
        disabled={isPending || isConfirming}
      />

      <button type="submit" disabled={isPending || isConfirming}>
        {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Deposit'}
      </button>

      {isSuccess && <p>Deposit successful!</p>}
      {error && <p>Error: {error.message}</p>}
    </form>
  );
}
```

## Transaction Handling

### Transaction States

```typescript
type TransactionState =
  | 'idle'           // No transaction
  | 'pending'        // Waiting for wallet signature
  | 'submitted'      // Signed, waiting for confirmation
  | 'confirming'     // In mempool, waiting for block
  | 'confirmed'      // Included in block
  | 'failed';        // Reverted or rejected

// Visual feedback for each state
const transactionMessages: Record<TransactionState, string> = {
  idle: '',
  pending: 'Please confirm in your wallet...',
  submitted: 'Transaction submitted, waiting for confirmation...',
  confirming: 'Transaction is being confirmed...',
  confirmed: 'Transaction confirmed!',
  failed: 'Transaction failed',
};
```

### Transaction Tracking Component

```typescript
// components/TransactionStatus.tsx
import { useWaitForTransactionReceipt } from 'wagmi';

interface TransactionStatusProps {
  hash: `0x${string}` | undefined;
  onSuccess?: () => void;
}

export function TransactionStatus({ hash, onSuccess }: TransactionStatusProps) {
  const { isLoading, isSuccess, isError, error } = useWaitForTransactionReceipt({
    hash,
    onSuccess,
  });

  if (!hash) return null;

  return (
    <div className="transaction-status">
      {isLoading && (
        <div className="flex items-center gap-2">
          <Spinner />
          <span>Confirming transaction...</span>
          <a href={`https://etherscan.io/tx/${hash}`} target="_blank">
            View on Etherscan
          </a>
        </div>
      )}

      {isSuccess && (
        <div className="text-green-600">
          Transaction confirmed!
        </div>
      )}

      {isError && (
        <div className="text-red-600">
          Transaction failed: {error?.message}
        </div>
      )}
    </div>
  );
}
```

## Error Handling

### Contract Error Parsing

```typescript
// utils/errors.ts
import { BaseError, ContractFunctionRevertedError } from 'viem';

export function parseContractError(error: unknown): string {
  if (error instanceof BaseError) {
    // Check for contract revert
    const revertError = error.walk(
      (err) => err instanceof ContractFunctionRevertedError
    );

    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName ?? 'Unknown error';

      // Map custom errors to user-friendly messages
      const errorMessages: Record<string, string> = {
        InsufficientBalance: 'You don\'t have enough balance',
        Unauthorized: 'You\'re not authorized to perform this action',
        SlippageExceeded: 'Price moved too much, try again',
        Expired: 'Transaction expired, please try again',
      };

      return errorMessages[errorName] ?? errorName;
    }

    // Check for user rejection
    if (error.message.includes('User rejected')) {
      return 'Transaction cancelled';
    }
  }

  return 'An unexpected error occurred';
}
```

### Error Boundary

```typescript
// components/Web3ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class Web3ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Network Handling

### Chain Switching

```typescript
import { useSwitchChain, useChainId } from 'wagmi';
import { mainnet, arbitrum } from 'wagmi/chains';

export function NetworkSwitcher() {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const supportedChains = [mainnet, arbitrum];

  return (
    <select
      value={chainId}
      onChange={(e) => switchChain({ chainId: Number(e.target.value) })}
      disabled={isPending}
    >
      {supportedChains.map((chain) => (
        <option key={chain.id} value={chain.id}>
          {chain.name}
        </option>
      ))}
    </select>
  );
}
```

### Wrong Network Warning

```typescript
import { useChainId, useAccount } from 'wagmi';

const SUPPORTED_CHAIN_IDS = [1, 42161]; // Mainnet, Arbitrum

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const chainId = useChainId();
  const { isConnected } = useAccount();

  if (isConnected && !SUPPORTED_CHAIN_IDS.includes(chainId)) {
    return (
      <div className="warning">
        <p>Please switch to a supported network</p>
        <NetworkSwitcher />
      </div>
    );
  }

  return <>{children}</>;
}
```

## Security Best Practices

### 1. Validate Before Signing

```typescript
// Always show transaction details before signing
function ConfirmTransaction({
  action,
  amount,
  recipient,
  onConfirm,
}: ConfirmTransactionProps) {
  return (
    <div className="confirmation-modal">
      <h3>Confirm Transaction</h3>
      <dl>
        <dt>Action</dt>
        <dd>{action}</dd>
        <dt>Amount</dt>
        <dd>{amount} ETH</dd>
        <dt>Recipient</dt>
        <dd>{recipient}</dd>
      </dl>
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}
```

### 2. Simulate Before Sending

```typescript
import { useSimulateContract } from 'wagmi';

function useDepositWithSimulation(amount: bigint) {
  // Simulate first
  const { data: simulation, error: simulationError } = useSimulateContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: 'deposit',
    args: [amount],
  });

  const { writeContract } = useWriteContract();

  const deposit = () => {
    if (simulationError) {
      throw new Error(`Transaction would fail: ${simulationError.message}`);
    }
    writeContract(simulation!.request);
  };

  return { deposit, simulationError };
}
```

### 3. Never Trust URL Parameters for Addresses

```typescript
// Bad: Using address from URL
const address = searchParams.get('recipient');
writeContract({ args: [address] }); // Phishing risk!

// Good: Always use known addresses or user confirmation
const KNOWN_CONTRACTS = {
  vault: '0x...',
  staking: '0x...',
};

// Or require explicit user confirmation
const [confirmed, setConfirmed] = useState(false);
```

### 4. Rate Limit Sensitive Operations

```typescript
import { useCallback, useRef } from 'react';

function useRateLimitedAction(cooldownMs: number = 5000) {
  const lastAction = useRef<number>(0);

  const canExecute = useCallback(() => {
    const now = Date.now();
    if (now - lastAction.current < cooldownMs) {
      return false;
    }
    lastAction.current = now;
    return true;
  }, [cooldownMs]);

  return canExecute;
}
```

## Performance Tips

1. **Use query keys properly** - Wagmi handles caching, don't duplicate
2. **Batch reads** - Use `useReadContracts` for multiple reads
3. **Avoid unnecessary re-renders** - Memoize callbacks and values
4. **Lazy load Web3** - Don't block initial page load

```typescript
// Batch multiple contract reads
import { useReadContracts } from 'wagmi';

function useVaultStats() {
  return useReadContracts({
    contracts: [
      { address: VAULT, abi, functionName: 'totalAssets' },
      { address: VAULT, abi, functionName: 'totalSupply' },
      { address: VAULT, abi, functionName: 'asset' },
    ],
  });
}
```
