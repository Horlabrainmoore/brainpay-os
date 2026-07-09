// packages/events/src/types/SupportedEventTypes.ts
export enum BrainPayEventType {
  // Payments
  PAYMENT_CREATED = "payment.created",
  PAYMENT_COMPLETED = "payment.completed",
  PAYMENT_FAILED = "payment.failed",
  PAYMENT_REFUNDED = "payment.refunded",

  // Orders
  ORDER_CREATED = "order.created",
  ORDER_UPDATED = "order.updated",
  ORDER_COMPLETED = "order.completed",

  // Trading
  TRADE_OPENED = "trade.opened",
  TRADE_MODIFIED = "trade.modified",
  TRADE_CLOSED = "trade.closed",

  // Wallets
  WALLET_CREATED = "wallet.created",
  WALLET_FUNDED = "wallet.funded",
  WALLET_WITHDRAWN = "wallet.withdrawn",

  // Buy Crypto
  BUY_QUOTE_REQUESTED = "buy.quote.requested",
  BUY_QUOTE_RECEIVED = "buy.quote.received",
  BUY_QUOTE_SELECTED = "buy.quote.selected",
  BUY_ORDER_CREATED = "buy.order.created",
  BUY_ORDER_COMPLETED = "buy.order.completed",
  BUY_ORDER_FAILED = "buy.order.failed",

  // Wallet Signing
  WALLET_SIGNING_STARTED = "wallet.signing.started",
  WALLET_SIGNING_COMPLETED = "wallet.signing.completed",

  // Bitcoin
  BITCOIN_BROADCAST_STARTED = "bitcoin.broadcast.started",
  BITCOIN_BROADCAST_COMPLETED = "bitcoin.broadcast.completed",
  BITCOIN_CONFIRMED = "bitcoin.confirmed",

  // Webhooks
  WEBHOOK_RECEIVED = "webhook.received",

  // Identity & Compliance
  KYC_STARTED = "kyc.started",
  KYC_APPROVED = "kyc.approved",
  KYC_REJECTED = "kyc.rejected",

  // Auth
  AUTH_LOGIN = "auth.login",
  AUTH_LOGOUT = "auth.logout",
  AUTH_FAILED = "auth.failed",

  // Workflows
  WORKFLOW_STARTED = "workflow.started",
  WORKFLOW_COMPLETED = "workflow.completed",
  WORKFLOW_FAILED = "workflow.failed",

  // Notifications
  NOTIFICATION_SENT = "notification.sent",

  // Audit
  AUDIT_CREATED = "audit.created",
}
