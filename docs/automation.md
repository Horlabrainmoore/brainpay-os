# BrainPay OS Automation Engine

## Architecture

The Automation Engine is the core orchestration layer for BrainPay OS. It consists of:

1. **EventBus** — Pub/Sub backbone for all system events
2. **ProviderRegistry** — Central registry for all providers (workflows, buy, blockchain, wallet)
3. **Webhook Gateway** — Unified endpoint for all incoming webhooks
4. **Workflow Engine** — Orchestrates actions based on triggers
5. **Firestore** — Event store, audit logs, and state management

## Event Flow

```
External Provider (Square, Coinbase, MT5, etc.)
          ↓
Webhook Gateway (/api/webhooks/{provider})
          ↓
Signature Verification + Replay Protection
          ↓
Normalize to BrainPayEvent
          ↓
EventBus.publish()
          ↓
┌─────────┴─────────┬──────────────┬──────────────┐
↓                   ↓              ↓              ↓
Firestore      Workflow        Notifications   Audit
Event Store    Triggers        & Alerts        Logs
```

## Supported Event Types

See `packages/events/src/types/SupportedEventTypes.ts` for the complete list.

Examples:
- `payment.created`, `payment.completed`, `payment.failed`
- `trade.opened`, `trade.closed`
- `wallet.created`, `wallet.funded`
- `buy.quote.requested`, `buy.order.created`
- `bitcoin.broadcast.started`, `bitcoin.confirmed`
- `kyc.approved`, `auth.login`

## Provider Registry

Every provider implements a standard interface:

### Workflow Providers
```typescript
interface WorkflowProvider {
  createWorkflow(input: WorkflowInput): Promise<Workflow>;
  publishWorkflow(id: string): Promise<void>;
  executeWorkflow(id: string, trigger: any): Promise<WorkflowExecution>;
}
```

### Buy Providers
```typescript
interface BuyProvider {
  getQuote(request: BuyQuoteRequest): Promise<BrainPayQuote>;
  createOrder(request: BuyOrderRequest): Promise<BuyOrder>;
  getOrderStatus(id: string): Promise<OrderStatus>;
  supports(asset: string): boolean;
}
```

### Blockchain Providers
```typescript
interface BlockchainProvider {
  getRecommendedFees(): Promise<FeeEstimate>;
  getAddress(address: string): Promise<AddressInfo>;
  broadcastTransaction(hex: string): Promise<TransactionResponse>;
  trackConfirmations(txid: string): Promise<AsyncIterableIterator<Confirmation>>;
}
```

### Wallet Providers
```typescript
interface WalletProvider {
  generateAddress(derivationPath: string): Promise<string>;
  buildSigningRequest(tx: Transaction): Promise<SigningRequest>;
  signTransaction(request: SigningRequest): Promise<SignedTransaction>;
}
```

## Firestore Collections

- `events/` — All normalized BrainPayEvents
- `event_snapshots/` — Periodic snapshots for replay
- `audit_logs/` — Immutable audit trail
- `workflows/` — Workflow definitions
- `workflow_runs/` — Workflow executions
- `idempotency_keys/` — Duplicate prevention
- `provider_health/` — Provider status and metrics

## Deployment

See `docs/setup/deployment.md` for full deployment instructions.

## Security

See `docs/setup/security.md` for webhook verification, secret management, and RBAC.
