// services/automation/webhookGateway.ts
import { EventBus } from "packages/events/src/EventBus";
import { BrainPayEvent, BrainPayEventType } from "packages/events/src/types/BrainPayEvent";
import { v4 as uuidv4 } from "uuid";

export interface WebhookPayload {
  provider: string;
  signature: string;
  timestamp: string;
  body: Record<string, any>;
}

export class WebhookGateway {
  constructor(private eventBus: EventBus) {}

  async handleWebhook(payload: WebhookPayload): Promise<void> {
    const { provider, signature, timestamp, body } = payload;

    // 1. Verify signature
    await this.verifySignature(provider, signature, timestamp, body);

    // 2. Check replay protection
    const age = Date.now() - parseInt(timestamp);
    if (age > 5 * 60 * 1000) {
      throw new Error("Webhook too old (replay protection)");
    }

    // 3. Check idempotency
    const idempotencyKey = body.idempotency_key || body.id || uuidv4();
    if (await this.isDuplicate(idempotencyKey)) {
      console.log(`Duplicate webhook (idempotency): ${idempotencyKey}`);
      return; // Already processed
    }

    // 4. Normalize to BrainPayEvent
    const event = await this.normalizeEvent(provider, body);

    // 5. Publish to EventBus
    await this.eventBus.publish(event);

    // 6. Log to audit
    await this.logAudit({
      action: "webhook_received",
      provider,
      eventType: event.type,
      organizationId: event.organizationId,
    });
  }

  private async verifySignature(provider: string, signature: string, timestamp: string, body: Record<string, any>): Promise<void> {
    const secret = process.env[`WEBHOOK_SECRET_${provider.toUpperCase()}`];
    if (!secret) {
      console.warn(`No webhook secret for provider: ${provider}`);
      return; // Skip verification if no secret (stub mode)
    }
    // TODO: Implement HMAC-SHA256 verification
  }

  private async isDuplicate(key: string): Promise<boolean> {
    // TODO: Check Firestore idempotency_keys collection
    return false;
  }

  private async normalizeEvent(provider: string, body: Record<string, any>): Promise<BrainPayEvent> {
    return {
      id: uuidv4(),
      version: "1.0",
      provider,
      service: this.getServiceFromProvider(provider),
      type: this.getEventTypeFromBody(provider, body),
      timestamp: new Date().toISOString(),
      organizationId: body.organization_id || "default",
      userId: body.user_id,
      payload: body,
      metadata: {
        correlationId: body.correlation_id || uuidv4(),
        traceId: body.trace_id || uuidv4(),
        schemaVersion: "1.0",
        replayable: true,
        source: provider,
      },
    };
  }

  private getServiceFromProvider(provider: string): string {
    const mapping: Record<string, string> = {
      square: "payments",
      kora: "payments",
      bitpay: "payments",
      coinbase: "crypto",
      mempool: "crypto",
      mt5: "trading",
      exness: "trading",
      blockcypher: "crypto",
    };
    return mapping[provider] || "automation";
  }

  private getEventTypeFromBody(provider: string, body: Record<string, any>): BrainPayEventType {
    // Map provider event types to BrainPayEventType
    const eventType = body.event_type || body.type || "webhook.received";
    return eventType as BrainPayEventType;
  }

  private async logAudit(data: Record<string, any>): Promise<void> {
    // TODO: Write to Firestore audit_logs collection
    console.log("Audit:", data);
  }
}
