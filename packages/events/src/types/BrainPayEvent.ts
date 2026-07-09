// packages/events/src/types/BrainPayEvent.ts
import { BrainPayEventType } from "./SupportedEventTypes";

export interface BrainPayEvent {
  id: string;
  version: "1.0";
  provider: string; // "square" | "coinbase" | "mempool" | "internal"
  service: string; // "payments" | "crypto" | "trading" | "automation"
  type: BrainPayEventType;
  timestamp: string; // ISO 8601
  organizationId: string;
  userId?: string;
  payload: Record<string, unknown>;
  metadata: {
    correlationId: string;
    traceId: string;
    schemaVersion: "1.0";
    replayable: boolean;
    source?: string;
    retryCount?: number;
  };
}

export interface EventQuery {
  organizationId?: string;
  type?: BrainPayEventType;
  provider?: string;
  userId?: string;
  after?: Date;
  before?: Date;
  limit?: number;
}

export interface EventStore {
  save(event: BrainPayEvent): Promise<void>;
  query(filter: EventQuery): Promise<BrainPayEvent[]>;
  getLastEvent(organizationId: string, type: BrainPayEventType): Promise<BrainPayEvent | null>;
}

export type EventHandler = (event: BrainPayEvent) => Promise<void>;
