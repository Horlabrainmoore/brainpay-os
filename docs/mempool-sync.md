# Mempool.js Integration Guide

BrainPay-OS uses **@mempool/mempool.js** (v3.0.0) for real-time Bitcoin blockchain data.

## Installation

```bash
npm install @mempool/mempool.js
```

## Quick Start

### Basic Client Initialization

```typescript
import mempoolJS from '@mempool/mempool.js';

const { bitcoin } = mempoolJS({
  protocol: 'https',
  hostname: 'mempool.space',
  network: 'mainnet', // or 'testnet', 'testnet4', 'signet'
});
```

### Fetch Address Statistics

```typescript
const address = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';

const addressData = await bitcoin.addresses.getAddress({ address });

console.log({
  totalBalance: addressData.chain_stats.funded_txo_sum - addressData.chain_stats.spent_txo_sum,
  txCount: addressData.chain_stats.tx_count,
  mempoolTxCount: addressData.mempool_stats.tx_count,
});
```

### Get Transaction Fees

```typescript
const fees = await bitcoin.fees.getFeesRecommended();

console.log({
  fast: fees.fastestFee,           // sat/vB (10 min)
  standard: fees.halfHourFee,       // sat/vB (30 min)
  economy: fees.hourFee,            // sat/vB (1 hour)
});
```

### Fetch Recent Mempool Transactions

```typescript
const recentTxs = await bitcoin.mempool.getMempoolRecent();

recentTxs.forEach((tx) => {
  console.log(`Tx: ${tx.txid}`);
  console.log(`Fee rate: ${tx.fee / tx.vsize} sat/vB`);
});
```

## API Reference

### Addresses API

```typescript
// Get address details
await bitcoin.addresses.getAddress({ address: '...' });

// Get address transactions (paginated)
await bitcoin.addresses.getAddressTxs({
  address: '...',
  from_index: 0,
  to_index: 24,
});

// Get address UTXOs (unspent outputs)
await bitcoin.addresses.getAddressUtxo({ address: '...' });
```

### Transactions API

```typescript
// Get transaction details
await bitcoin.transactions.getTx({ txid: '...' });

// Get RBF (replace-by-fee) history
await bitcoin.transactions.getTxRbfHistory({ txid: '...' });

// Get outputs spent by transaction
await bitcoin.transactions.getTxOutspends({ txid: '...' });
```

### Blocks API

```typescript
// Get current block height
await bitcoin.blocks.getBlocksTipHeight();

// Get block by hash
await bitcoin.blocks.getBlock({ hash: '...' });

// Get block transactions (paginated)
await bitcoin.blocks.getBlockTxs({
  hash: '...',
  index: 0, // page
});
```

### Fees API

```typescript
// Get recommended fee rates
await bitcoin.fees.getFeesRecommended();
// Returns: { fastestFee, halfHourFee, hourFee, economyFee, minimumFee }
```

### Mempool API

```typescript
// Get mempool statistics
await bitcoin.mempool.getMempool();
// Returns: { vsize, count, total_fee_sat, fee_range }

// Get all mempool transaction IDs
await bitcoin.mempool.getMempoolTxids();

// Get recent mempool transactions
await bitcoin.mempool.getMempoolRecent();
```

## React Integration (BrainPay-OS)

### Using React Query Hook

```typescript
import { useAddressStats } from '@/hooks/useMempool';

export function WalletBalance({ address }: { address: string }) {
  const { data: stats, isLoading, error } = useAddressStats(address);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Balance: {stats?.balanceBtc.toFixed(4)} BTC</h3>
      <p>Transactions: {stats?.totalTxCount}</p>
      <p>Unconfirmed: {stats?.unconfirmedBalanceSats} sats</p>
    </div>
  );
}
```

### Using Service Functions

```typescript
import * as mempoolService from '@/services/mempool';

const stats = await mempoolService.getAddressStats(address);
const fees = await mempoolService.getFeeEstimates();
const txs = await mempoolService.getAddressTransactions(address, 0, 24);
```

## Performance Optimizations

### Query Caching Strategy

```typescript
const queryClient = useQueryClient();

// Stale time: 1 minute (refetch if older than 1 min)
// Cache time: 5 minutes (keep in memory for 5 min)
staleTime: 60 * 1000,
gcTime: 5 * 60 * 1000,
```

### Pagination Example

```typescript
const [page, setPage] = useState(1);
const PAGE_SIZE = 25;

const fromIndex = (page - 1) * PAGE_SIZE;
const toIndex = fromIndex + PAGE_SIZE - 1;

const { data: txs } = useAddressTransactions(address, fromIndex, toIndex);
```

## Error Handling

```typescript
try {
  const stats = await mempoolService.getAddressStats(address);
} catch (error) {
  if (error instanceof Error) {
    console.error('Mempool error:', error.message);
  }
}
```

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `404 Not Found` | Address doesn't exist | Validate address format |
| `Connection timeout` | API unreachable | Check network, try testnet |
| `Invalid address` | Malformed address | Use `validateBtcAddress()` |
| `Rate limited` | Too many requests | Use polling intervals, cache |

## Environment Variables

```bash
# .env.local
VITE_MEMPOOL_API_BASE=https://mempool.space
VITE_MEMPOOL_NETWORK=mainnet  # or testnet, testnet4, signet
```

## WebSocket (Future)

Mempool.js also supports WebSocket for live updates:

```typescript
// Coming soon in v4.0
const ws = mempoolJS.websocket();
ws.on('tx', (tx) => console.log('New tx:', tx.txid));
ws.connect();
```

## References

- **Mempool.js Docs**: https://github.com/mempool/mempool.js
- **Mempool API Docs**: https://mempool.space/api
- **Bitcoin Address Formats**: https://en.bitcoin.it/wiki/Address
