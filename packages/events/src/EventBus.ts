// packages/events/src/EventBus.ts
import { BrainPayEvent, EventHandler, EventQuery, EventStore } from "./types/BrainPayEvent";
import { BrainPayEventType } from "./types/SupportedEventTypes";

export interface IEventBus {
  publish(event: BrainPayEvent): Promise<void>;
  subscribe(type: BrainPayEventType, handler: EventHandler): () => void;
  replay(query: EventQuery): Promise<BrainPayEvent[]>;
  getEventStore(): EventStore;
}

export class EventBus implements IEventBus {
  private handlers = new Map<BrainPayEventType, Set<EventHandler>>();
  private eventStore: EventStore;

  constructor(eventStore: EventStore) {
    this.eventStore = eventStore;
  }

  async publish(event: BrainPayEvent): Promise<void> {
    // 1. Save to event store
    await this.eventStore.save(event);

    // 2. Dispatch to handlers
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      await Promise.all(Array.from(handlers).map(h => h(event).catch(console.error)));
    }
  }

  subscribe(type: BrainPayEventType, handler: EventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  async replay(query: EventQuery): Promise<BrainPayEvent[]> {
    return this.eventStore.query(query);
  }

  getEventStore(): EventStore {
    return this.eventStore;
  }
}
