# 🚀 Blockchain Payment Analytics Module

Complete production-ready module for real-time blockchain transaction analysis, fee estimation, and mempool monitoring.

## 📦 What's Included

### Core Services
- **`src/features/analytics/types.ts`** — Type definitions and Zod schemas
- **`src/features/analytics/blockchain-payment-analytics.ts`** — Main analytics service

### Utilities
- **`src/lib/confirmation-estimator.ts`** — Fee estimation and prediction functions
- **`src/hooks/useBlockchainAnalytics.ts`** — 8 custom React hooks

### Components
- **`src/components/analytics/MempoolDashboard.tsx`** — Full-featured dashboard
- **`src/components/analytics/PaymentAnalyticsPage.tsx`** — Page wrapper

---

## 🎯 Quick Start

### 1. Add to Your Routes

```typescript
// src/App.tsx
import PaymentAnalyticsPage from './components/analytics/PaymentAnalyticsPage';

// Add to Routes:
<Route path="/analytics" element={<PaymentAnalyticsPage />} />
```

### 2. Basic Usage

```typescript
import { MempoolDashboard } from '@/components/analytics/MempoolDashboard';

export default function MyPage() {
  const config = {
    rpcEndpoint: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',
  };

  return (
    <MempoolDashboard
      config={config}
      userFeeRate={28}
      autoRefreshInterval={30000}
    />
  );
}
```

### 3. Use Individual Hooks

```typescript
import {
  useCombinedMempoolData,
  usePredictedConfirmation,
  useAutoBumpCheck,
} from '@/hooks/useBlockchainAnalytics';
import {
  estimateBlocks,
  advancedFeeEstimate,
  shouldAutoBump,
} from '@/lib/confirmation-estimator';

function MyComponent() {
  const config = { rpcEndpoint: '...' };
  const { heatmap, transactions, metrics } = useCombinedMempoolData(config);
  const { estimate } = usePredictedConfirmation(heatmap, 28);
  
  if (!estimate) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Estimated blocks: {estimate.blocks}</p>
      <p>ETA: {estimate.time} minutes</p>
      <p>Status: {estimate.verdict.verdict}</p>
    </div>
  );
}
```

---

## 📊 Features

### ✨ Real-Time Mempool Data
- Fetches live fee tiers from mempool.space API
- Caches data with configurable TTL
- Auto-refresh at intervals

### 🔮 Advanced Fee Estimation
- Predicts confirmation time with confidence scores
- Calculates optimal replacement fees
- Batch fee estimation for multiple transactions

### 📈 Smart Auto-Bump Logic
- Detects stuck transactions
- Recommends fee increases
- Configurable urgency levels (low/medium/high/critical)

### 🎨 Beautiful Dashboard
- 4 professional tabs (Overview, Heatmap, Distribution, Transactions)
- Interactive fee tier visualization
- Real-time metric updates
- Responsive design (mobile-first)

### 🔌 Multiple Integration Patterns
- Full dashboard component
- Individual React hooks
- Standalone service class
- WebSocket streaming for pending transactions

---

## 🧩 API Reference

### Services

#### `BlockchainPaymentAnalytics`
```typescript
class BlockchainPaymentAnalytics {
  fetchHeatmap(): Promise<BlockLayer[]>
  fetchMempoolTransactions(limit?: number): Promise<PaymentTransaction[]>
  calculateMetrics(txs: PaymentTransaction[]): Promise<AnalyticsMetrics>
  subscribeToPendingTransactions(cb: Callback): Promise<() => void>
  startPolling(cb: Callback): () => void
  clearCache(): void
  disconnect(): void
}
```

### Estimation Functions

```typescript
// Basic estimation
estimateBlocks(feeRate: number, heatmap: BlockLayer[]): number
estimateTime(blocks: number): number
feeVerdict(blocks: number): { label, verdict, recommendation }

// Advanced
advancedFeeEstimate(feeRate: number, heatmap: BlockLayer[]): FeeEstimate
calculateReplacementFee(currentFee: number, heatmap: BlockLayer[], urgency?: string): ReplacementFeeInfo
estimateBatchFees(txs: Array<{txid, fee}>, heatmap: BlockLayer[]): BatchFeeEstimate[]

// Helpers
recommendFeeRate(heatmap: BlockLayer[], desiredBlocks?: number): number
analyzeFeedTrend(prev: BlockLayer[], curr: BlockLayer[]): { direction, changePercent }
shouldAutoBump(feeRate: number, heatmap: BlockLayer[], maxWaitTime?: number): { shouldBump, reason, suggestedFee }
```

### React Hooks

```typescript
// Primary hooks
useCombinedMempoolData(config: AnalyticsConfig)
  → { heatmap, transactions, metrics, snapshot, isLoading }

usePredictedConfirmation(heatmap: BlockLayer[], feeRate: number)
  → { estimate: { blocks, time, verdict }, isLoading, error }

// Secondary hooks
useBlockchainTransactions(config, enabled?)
useM empoolHeatmap(config, enabled?)
usePaymentAnalytics(transactions, enabled?)
usePendingTransactions(config, enabled?)
useMempoolPoller(config, onUpdate, enabled?)
useTransactionFeeMonitor(config, feeRate, onChange?)
useSuggestedFeeRate(heatmap, desiredBlocks?)
useFeeTrend(heatmap)
useAutoBumpCheck(config, feeRate, maxWaitTime?)
```

---

## ⚙️ Configuration

```typescript
interface AnalyticsConfig {
  rpcEndpoint: string;           // Required: API endpoint
  wsEndpoint?: string;           // Optional: WebSocket for pending txs
  contractAddress?: string;      // Optional: Contract to filter by
  pollInterval?: number;         // Default: 30000ms
  cacheExpiry?: number;          // Default: 60000ms
  maxTransactions?: number;      // Default: 100
}
```

### Environment Setup

```bash
# .env
REACT_APP_RPC_ENDPOINT=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
REACT_APP_WS_ENDPOINT=wss://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

---

## 🔗 Integration Examples

### With Firestore (Persistence)

```typescript
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { useCombinedMempoolData } from '@/hooks/useBlockchainAnalytics';

function SaveAnalyticsData() {
  const { heatmap, metrics } = useCombinedMempoolData(config);
  const db = getFirestore();

  const handleSave = async () => {
    await setDoc(doc(db, 'analytics', 'mempool'), {
      heatmap,
      metrics,
      timestamp: new Date(),
    });
  };

  return <button onClick={handleSave}>Save to Firestore</button>;
}
```

### With Auto-Bump Engine

```typescript
import { shouldAutoBump } from '@/lib/confirmation-estimator';

async function checkAndBumpFees(txid: string, currentFee: number, heatmap: BlockLayer[]) {
  const { shouldBump, suggestedFee } = shouldAutoBump(currentFee, heatmap);
  
  if (shouldBump && suggestedFee) {
    await autoBumpTransaction(txid, suggestedFee);
  }
}
```

### With Alerts/Notifications

```typescript
import { useAutoBumpCheck } from '@/hooks/useBlockchainAnalytics';
import { toast } from 'sonner';

function TransactionMonitor({ txFee }: { txFee: number }) {
  const { data: autoBumpData } = useAutoBumpCheck(config, txFee);

  useEffect(() => {
    if (autoBumpData?.shouldBump) {
      toast.error(`Transaction stuck! Increase fee to ${autoBumpData.suggestedFee}`);
    }
  }, [autoBumpData]);

  return null;
}
```

---

## 📊 Data Flow

```
┌─────────────────────────────────────┐
│  mempool.space API                  │
│  - Heatmap (fee tiers)              │
│  - Transactions                     │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  BlockchainPaymentAnalytics         │
│  - Fetch & cache data               │
│  - Calculate metrics                │
│  - Poll & stream updates            │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  React Query                        │
│  - Manage state                     │
│  - Cache invalidation               │
│  - Error handling                   │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Custom Hooks                       │
│  - useCombinedMempoolData           │
│  - usePredictedConfirmation         │
│  - useAutoBumpCheck                 │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  UI Components                      │
│  - MempoolDashboard                 │
│  - Charts & Visualizations          │
│  - Fee Estimator                    │
└─────────────────────────────────────┘
```

---

## 🚀 Advanced Usage

### Custom Fee Estimation Logic

```typescript
import { advancedFeeEstimate } from '@/lib/confirmation-estimator';

function CustomFeeStrategy() {
  const { heatmap } = useCombinedMempoolData(config);
  
  const myEstimate = advancedFeeEstimate(28, heatmap);
  
  if (myEstimate.confidence < 0.7) {
    // Fee estimate is uncertain, increase by 10%
    const saferFee = Math.ceil(28 * 1.1);
  }

  return <div>{myEstimate.recommendation}</div>;
}
```

### Monitoring Multiple Transactions

```typescript
import { estimateBatchFees } from '@/lib/confirmation-estimator';

function BatchMonitor() {
  const { heatmap } = useCombinedMempoolData(config);
  
  const estimates = estimateBatchFees([
    { txid: 'tx1', currentFee: 25 },
    { txid: 'tx2', currentFee: 35 },
  ], heatmap);

  return (
    <table>
      <thead><tr><th>TX ID</th><th>Blocks</th><th>Action</th></tr></thead>
      <tbody>
        {estimates.map(est => (
          <tr key={est.txid}>
            <td>{est.txid}</td>
            <td>{est.estimate.blocks}</td>
            <td>{est.replacement ? 'Bump' : 'Wait'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## ⚡ Performance Tips

1. **Use React Query caching** — Don't refetch unnecessarily
2. **Set appropriate poll intervals** — 30-60s is optimal
3. **Batch operations** — Use `estimateBatchFees()` for multiple txs
4. **Monitor cache size** — Set `maxTransactions` appropriately
5. **Disconnect on unmount** — Always call `analytics.disconnect()`

---

## 🔧 Troubleshooting

### "Failed to fetch heatmap"
- Check your RPC endpoint is correct
- Verify network connectivity
- Check API rate limits

### "Empty heatmap returned"
- mempool.space may be temporarily unavailable
- Wait 30 seconds and try again

### "Fee estimates seem off"
- Verify your fee rate is in sat/vB not gwei
- Check if mempool is congested (unusual patterns)

---

## 📄 License

MIT - Use freely in your projects

---

## 🤝 Next Steps

1. ✅ Add to your router
2. ✅ Configure your RPC endpoint
3. ✅ Connect to Firestore for persistence
4. ✅ Wire to auto-bump engine
5. ✅ Add email/SMS alerts

**Ready to ship! 🚀**