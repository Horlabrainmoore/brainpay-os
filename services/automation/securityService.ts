// services/automation/securityService.ts
import crypto from "crypto";

export class SecurityService {
  async verifyWebhookSignature(
    provider: string,
    signature: string,
    timestamp: string,
    payload: Record<string, any>
  ): Promise<boolean> {
    const secret = process.env[`WEBHOOK_SECRET_${provider.toUpperCase()}`];
    if (!secret) {
      console.warn(`No secret for provider: ${provider}`);
      return false;
    }

    const message = `${timestamp}.${JSON.stringify(payload)}`;
    const computed = crypto.createHmac("sha256", secret).update(message).digest("hex");
    return computed === signature;
  }

  async checkIdempotency(key: string): Promise<boolean> {
    // TODO: Firestore idempotency_keys collection
    return false;
  }

  generateCorrelationId(): string {
    return crypto.randomUUID();
  }

  generateTraceId(): string {
    return crypto.randomUUID();
  }
}
