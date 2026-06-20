// functions/src/firestoreTypes.ts
export interface PerformanceTrace {
  id: string;
  traceName: string;
  durationMs: number;
  timestamp: number;
}

export interface WalletActivity {
  wallet: string;
  txid: string;
  amount: number;
  confirmations: number;
  timestamp: number;
}

export interface AuditLog {
  action: string;
  actor: string;
  metadata: Record<string, unknown>;
  createdAt: number;
}
