# BrainPay-OS Service Architecture

## Overview

Services in BrainPay-OS are organized into logical domains:

- **Mempool Service** — Bitcoin blockchain data
- **BTCPay Service** — Payment processing
- **Wallet Service** — Address management
- **Analytics Service** — Telemetry & observability
- **Treasury Service** — DAO governance
- **AI Service** — Agent execution

## Service Patterns

### 1. Mempool Service

**Location**: `src/services/mempool.ts`

**Responsibilities**:
- Fetch address statistics (balance, tx count)
- Query transactions & blocks
- Estimate transaction fees
- Validate Bitcoin addresses
- Get mempool statistics

**Usage**:
```typescript
import * as mempoolService from '@/services/mempool';

const stats = await mempoolService.getAddressStats(address);
const fees = await mempoolService.getFeeEstimates();
```

**React Hook**:
```typescript
import { useAddressStats, useFeeEstimates } from '@/hooks/useMempool';

const { data: stats } = useAddressStats(address);
```

### 2. BTCPay Service (Roadmap)

**Location**: `functions/src/btcpayBroker.ts`

**Responsibilities**:
- Create invoices
- Track payments
- Handle webhooks
- Settle transactions
- Generate payment links

**Expected Usage**:
```typescript
const invoice = await btcpayService.createInvoice({
  amount: 0.5,
  currency: 'BTC',
  orderId: 'order-123',
});
```

### 3. Wallet Service (Roadmap)

**Location**: `functions/src/walletService.ts`

**Responsibilities**:
- Generate addresses
- Track wallet balances
- Manage UTXO sets
- Sign transactions
- Export keys securely

### 4. Analytics Service

**Location**: `src/lib/analytics.ts`

**Responsibilities**:
- Track user events
- Send telemetry
- Manage performance metrics
- Handle crash reports

**Usage**:
```typescript
import { trackEvent } from '@/lib/analytics';

trackEvent('payment_completed', {
  amount: 0.5,
  currency: 'BTC',
});
```

## Error Handling Pattern

All services follow consistent error handling:

```typescript
export async function serviceFunction() {
  try {
    // Attempt operation
    const result = await externalAPI();
    return result;
  } catch (error) {
    throw new Error(`Service failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

## Caching Strategy

Services use React Query for client-side caching:

```typescript
staleTime: 60 * 1000,      // Revalidate after 1 minute
gcTime: 5 * 60 * 1000,     // Keep in memory for 5 minutes
retry: 2,                   // Retry twice on failure
retryDelay: 1000,           // Wait 1 second between retries
```

## Dependency Injection

Services are initialized at the module level and used throughout the app:

```typescript
// src/services/mempool.ts (Singleton pattern)
const mempoolClient = initMempoolClient();

// Used in multiple places
export async function getAddressStats(address: string) {
  // mempoolClient automatically reused
}
```

## Testing Services

```typescript
// Test Bitcoin address validation
const { valid, kind } = validateBitcoinAddress('bc1qar0...');
assert(valid === true);
assert(kind === 'Bech32');

// Test fee fetching
const fees = await getFeeEstimates();
assert(fees.fastestFee > 0);
```

## Monitoring & Debugging

### Service Logs

```typescript
console.log('🔄 Fetching address stats:', address);
const stats = await getAddressStats(address);
console.log('✅ Stats loaded:', stats);
```

### Error Tracking

Errors are automatically sent to Crashlytics:

```typescript
import { logErrorToFirebase } from '@/lib/crashlytics';

try {
  await getAddressStats(address);
} catch (error) {
  logErrorToFirebase(error);
}
```

## Future Services

### Lightning Service
- Generate invoice QR codes
- Track LNURL payments
- Manage channels

### Compliance Service
- AML/KYC screening
- Transaction monitoring
- Audit logging

### AI Service
- Treasury analysis
- Risk scoring
- Recommendation engine
