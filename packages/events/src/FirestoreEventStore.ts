// packages/events/src/FirestoreEventStore.ts
import * as admin from "firebase-admin";
import { BrainPayEvent, EventQuery, EventStore } from "./types/BrainPayEvent";
import { BrainPayEventType } from "./types/SupportedEventTypes";

export class FirestoreEventStore implements EventStore {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  async save(event: BrainPayEvent): Promise<void> {
    await this.db.collection("events").doc(event.id).set({
      ...event,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  async query(filter: EventQuery): Promise<BrainPayEvent[]> {
    let q: FirebaseFirestore.Query = this.db.collection("events");

    if (filter.organizationId) {
      q = q.where("organizationId", "==", filter.organizationId);
    }
    if (filter.type) {
      q = q.where("type", "==", filter.type);
    }
    if (filter.provider) {
      q = q.where("provider", "==", filter.provider);
    }
    if (filter.userId) {
      q = q.where("userId", "==", filter.userId);
    }
    if (filter.after) {
      q = q.where("timestamp", ">=", filter.after);
    }
    if (filter.before) {
      q = q.where("timestamp", "<=", filter.before);
    }

    const limit = filter.limit || 1000;
    q = q.orderBy("timestamp", "desc").limit(limit);

    const snap = await q.get();
    return snap.docs.map(doc => doc.data() as BrainPayEvent);
  }

  async getLastEvent(organizationId: string, type: BrainPayEventType): Promise<BrainPayEvent | null> {
    const snap = await this.db
      .collection("events")
      .where("organizationId", "==", organizationId)
      .where("type", "==", type)
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (snap.empty) return null;
    return snap.docs[0].data() as BrainPayEvent;
  }
}
