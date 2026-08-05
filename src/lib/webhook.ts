import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { safeFetch } from "@/lib/safe-fetch";
import { captureError, logInfo } from "@/lib/observability";
import type { Prisma } from "@generated/prisma/client";

export type WebhookEvent =
  | { type: "event.created"; payload: Record<string, unknown> }
  | { type: "event.approved"; payload: Record<string, unknown> }
  | { type: "event.updated"; payload: Record<string, unknown> }
  | { type: "event.deleted"; payload: Record<string, unknown> };

/** Attempts before a delivery is parked as FAILED. */
const MAX_ATTEMPTS = 5;

/** Backoff per attempt number, in minutes: ~1m, 5m, 30m, 2h. */
const BACKOFF_MINUTES = [1, 5, 30, 120];

/**
 * Record a webhook event and attempt delivery immediately.
 *
 * Delivery used to be fire-and-forget: a customer endpoint that was briefly
 * down lost the event outright, with no retry and nothing to look at
 * afterwards. Every event is now persisted first, so a failure is a row that
 * the retry sweep will pick up rather than a line in a log nobody reads.
 *
 * Never throws — a webhook must not be able to fail the action that caused it.
 */
export async function deliverWebhook(
  tenantId: string,
  event: WebhookEvent
): Promise<void> {
  try {
    const config = await prisma.webhookConfig.findFirst({
      where: { tenantId, enabled: true },
      select: { id: true },
    });

    // Nothing configured — don't accumulate rows nobody will ever read.
    if (!config) return;

    const delivery = await prisma.webhookDelivery.create({
      data: {
        tenantId,
        eventType: event.type,
        payload: event.payload as Prisma.InputJsonValue,
        nextAttemptAt: new Date(),
      },
      select: { id: true },
    });

    await attemptDelivery(delivery.id);
  } catch (err) {
    await captureError(err, { scope: "webhook.enqueue", tenantId, eventType: event.type });
  }
}

/**
 * Try one delivery and record the outcome. Returns true when delivered.
 */
export async function attemptDelivery(deliveryId: string): Promise<boolean> {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { tenant: { select: { webhookConfig: true } } },
  });

  if (!delivery || delivery.status === "DELIVERED") return false;

  const config = delivery.tenant.webhookConfig;
  if (!config || !config.enabled) {
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "FAILED",
        lastError: "No enabled webhook configuration",
        nextAttemptAt: null,
      },
    });
    return false;
  }

  const attempts = delivery.attempts + 1;

  const body = JSON.stringify({
    event: delivery.eventType,
    createdAt: delivery.createdAt.toISOString(),
    data: delivery.payload,
  });

  const signature = crypto.createHmac("sha256", config.secret).update(body).digest("hex");

  try {
    // The destination is customer-configured, so it goes through the SSRF
    // guards: without them a webhook URL is a way to make our servers issue
    // POSTs to hosts only they can reach.
    const response = await safeFetch(
      config.url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Delivery": delivery.id,
          "X-Webhook-Attempt": String(attempts),
          "User-Agent": "Eventful-Webhook/1.0",
        },
        body,
      },
      { timeoutMs: 10_000 }
    );

    if (response.ok) {
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "DELIVERED",
          attempts,
          responseCode: response.status,
          deliveredAt: new Date(),
          nextAttemptAt: null,
          lastError: null,
        },
      });

      logInfo("webhook delivered", {
        scope: "webhook.deliver",
        tenantId: delivery.tenantId,
        eventType: delivery.eventType,
        attempts,
      });
      return true;
    }

    await recordFailure(
      deliveryId,
      attempts,
      `HTTP ${response.status}`,
      response.status,
      delivery.tenantId
    );
    return false;
  } catch (err) {
    await recordFailure(
      deliveryId,
      attempts,
      err instanceof Error ? err.message : String(err),
      null,
      delivery.tenantId
    );
    return false;
  }
}

async function recordFailure(
  deliveryId: string,
  attempts: number,
  message: string,
  responseCode: number | null,
  tenantId: string
) {
  const exhausted = attempts >= MAX_ATTEMPTS;
  const backoff = BACKOFF_MINUTES[Math.min(attempts - 1, BACKOFF_MINUTES.length - 1)];

  await prisma.webhookDelivery.update({
    where: { id: deliveryId },
    data: {
      status: exhausted ? "FAILED" : "PENDING",
      attempts,
      lastError: message.slice(0, 1000),
      responseCode,
      nextAttemptAt: exhausted ? null : new Date(Date.now() + backoff * 60_000),
    },
  });

  if (exhausted) {
    // Worth surfacing: the customer's integration has been silently broken
    // for as long as the retries took.
    await captureError(new Error(`Webhook delivery gave up: ${message}`), {
      scope: "webhook.deliver",
      tenantId,
      deliveryId,
      attempts,
    });
  }
}

/**
 * Retry deliveries that are due. Driven by the cron endpoint.
 */
export async function retryPendingDeliveries(limit = 50): Promise<{
  attempted: number;
  delivered: number;
}> {
  const due = await prisma.webhookDelivery.findMany({
    where: { status: "PENDING", nextAttemptAt: { lte: new Date() } },
    select: { id: true },
    orderBy: { nextAttemptAt: "asc" },
    take: limit,
  });

  let delivered = 0;
  for (const row of due) {
    if (await attemptDelivery(row.id)) delivered++;
  }

  return { attempted: due.length, delivered };
}
