import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { after } from "next/server";
import { UnsafeUrlError, safeFetch } from "@/lib/safe-fetch";

type WebhookEvent =
  | { type: "event.created"; payload: Record<string, unknown> }
  | { type: "event.approved"; payload: Record<string, unknown> }
  | { type: "event.updated"; payload: Record<string, unknown> }
  | { type: "event.deleted"; payload: Record<string, unknown> };

const TIMEOUT_MS = 10_000;
const RETRY_DELAYS_MS = [1_000, 5_000]; // up to 3 attempts in total

/**
 * Look up the tenant's webhook config and deliver the event if configured.
 * Delivery runs after the response is sent (via `after`), with a timeout
 * and retries on network errors, 429 and 5xx. Never throws.
 */
export async function deliverWebhook(
  tenantId: string,
  event: WebhookEvent,
): Promise<void> {
  const task = () => deliverNow(tenantId, event);
  try {
    // Keeps the work alive on serverless platforms after the response.
    after(task);
  } catch {
    // Outside a request (scripts, tests): just run it.
    await task();
  }
}

async function deliverNow(tenantId: string, event: WebhookEvent): Promise<void> {
  try {
    const config = await prisma.webhookConfig.findFirst({
      where: { tenantId, enabled: true },
    });

    if (!config) return; // No webhook configured or not enabled – nothing to do.

    const deliveryId = crypto.randomUUID();
    const body = JSON.stringify({
      id: deliveryId,
      event: event.type,
      createdAt: new Date().toISOString(),
      data: event.payload,
    });

    const signature = crypto
      .createHmac("sha256", config.secret)
      .update(body)
      .digest("hex");

    for (let attempt = 1; ; attempt++) {
      let retryable: boolean;
      try {
        const response = await safeFetch(config.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            // Same across retries so receivers can de-duplicate.
            "X-Webhook-Id": deliveryId,
            "X-Webhook-Attempt": String(attempt),
            "User-Agent": "Eventful-Webhook/1.0",
          },
          body,
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (response.ok) return;
        retryable = response.status === 429 || response.status >= 500;
        console.error(
          `[webhook] ${event.type} attempt ${attempt} to ${config.url} returned ${response.status}: ${await response.text().catch(() => "no body")}`,
        );
      } catch (err) {
        if (err instanceof UnsafeUrlError) {
          console.error(`[webhook] refusing to deliver to ${config.url}: ${err.message}`);
          return;
        }
        retryable = true;
        console.error(`[webhook] ${event.type} attempt ${attempt} to ${config.url} failed:`, err);
      }

      const delay = RETRY_DELAYS_MS[attempt - 1];
      if (!retryable || delay === undefined) return;
      await new Promise((r) => setTimeout(r, delay));
    }
  } catch (err) {
    console.error("[webhook] delivery failed:", err);
  }
}
