import { prisma } from "@/lib/prisma";
import crypto from "crypto";

type WebhookEvent =
  | { type: "event.created"; payload: Record<string, unknown> }
  | { type: "event.approved"; payload: Record<string, unknown> }
  | { type: "event.updated"; payload: Record<string, unknown> }
  | { type: "event.deleted"; payload: Record<string, unknown> };

/**
 * Look up the tenant's webhook config and deliver the event if configured.
 * Catches all errors internally – never throws.
 */
export async function deliverWebhook(
  tenantId: string,
  event: WebhookEvent,
): Promise<void> {
  try {
    const config = await prisma.webhookConfig.findFirst({
      where: { tenantId, enabled: true },
    });

    if (!config) return; // No webhook configured or not enabled – nothing to do.

    const body = JSON.stringify({
      event: event.type,
      createdAt: new Date().toISOString(),
      data: event.payload,
    });

    const signature = crypto
      .createHmac("sha256", config.secret)
      .update(body)
      .digest("hex");

    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "User-Agent": "Eventful-Webhook/1.0",
      },
      body,
    });

    if (!response.ok) {
      console.error(
        `[webhook] delivery to ${config.url} returned ${response.status}: ${await response.text().catch(() => "no body")}`,
      );
    }
  } catch (err) {
    console.error("[webhook] delivery failed:", err);
  }
}