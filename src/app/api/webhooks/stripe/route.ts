import { getStripe, PLANS, type PlanKey } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  sendPaymentFailed,
  sendPaymentReceipt,
  sendSubscriptionEnded,
} from "@/lib/email";
import { formatAmount, formatDate, getBillingContacts } from "@/lib/billing-contacts";
import { getAppBaseUrl } from "@/lib/urls";
import { captureError, captureWarning, logInfo } from "@/lib/observability";

export const runtime = "nodejs";

/** Statuses that keep a tenant on its paid plan. */
const ACTIVE_STATUSES: Stripe.Subscription.Status[] = ["active", "trialing"];

/**
 * A failed renewal should not instantly cut off a paying customer — Stripe
 * retries for days. Keep access during the dunning window and downgrade only
 * once Stripe gives up.
 */
const GRACE_STATUSES: Stripe.Subscription.Status[] = ["past_due", "incomplete"];

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Verifying against an empty secret rejects everything anyway; say why.
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Stripe retries deliveries, and a retry of an already-applied event must
  // not re-run its side effects. Claiming the id first makes replays no-ops.
  try {
    await prisma.processedWebhookEvent.create({
      data: { id: event.id, type: event.type },
    });
  } catch {
    console.log("[stripe webhook] duplicate event ignored:", event.id);
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await handleEvent(event);
  } catch (err) {
    await captureError(err, { scope: "stripe.webhook", eventType: event.type, eventId: event.id });
    // Release the idempotency claim so Stripe's retry can be processed.
    await prisma.processedWebhookEvent
      .delete({ where: { id: event.id } })
      .catch(() => {});
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.metadata?.tenantId;
      if (!tenantId) {
        console.warn("[stripe webhook] checkout session without tenantId:", session.id);
        break;
      }

      const customerId = idOf(session.customer);
      const subscriptionId = idOf(session.subscription);

      // Read the subscription back so the plan comes from the price actually
      // purchased rather than being assumed to be Pro.
      let plan: PlanKey = "PRO";
      if (subscriptionId) {
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        plan = planFromSubscription(subscription);
      }

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          planExpiresAt: null,
        },
      });

      logInfo("tenant upgraded", { scope: "stripe.checkout", tenantId, plan });
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const tenant = await findTenantForSubscription(sub);
      if (!tenant) break;

      const plan = planFromSubscription(sub);

      if (ACTIVE_STATUSES.includes(sub.status)) {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            plan,
            stripeSubscriptionId: sub.id,
            stripeCustomerId: idOf(sub.customer) ?? tenant.stripeCustomerId,
            planExpiresAt: null,
          },
        });
      } else if (GRACE_STATUSES.includes(sub.status)) {
        // Keep the plan, record when the grace period runs out so the UI can
        // warn the customer.
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            stripeSubscriptionId: sub.id,
            planExpiresAt: graceDeadline(sub),
          },
        });
        await captureWarning("subscription in grace period", {
          scope: "stripe.subscription",
          tenantId: tenant.id,
          status: sub.status,
        });
      } else {
        // canceled, unpaid, incomplete_expired, paused
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { plan: "FREE", planExpiresAt: null },
        });
        await notifySubscriptionEnded(
          tenant.id,
          sub.status === "unpaid" ? "unpaid" : "canceled"
        );
        logInfo("tenant downgraded", {
          scope: "stripe.subscription",
          tenantId: tenant.id,
          status: sub.status,
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const tenant = await findTenantForSubscription(sub);
      if (!tenant) break;

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { plan: "FREE", stripeSubscriptionId: null, planExpiresAt: null },
      });

      await notifySubscriptionEnded(tenant.id, "canceled");
      logInfo("tenant downgraded to FREE", {
        scope: "stripe.subscription",
        tenantId: tenant.id,
      });
      break;
    }

    case "invoice.payment_failed": {
      // Without this, a customer whose card stopped working kept their paid
      // plan indefinitely.
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = idOf(invoice.customer);
      if (!customerId) break;

      const tenant = await prisma.tenant.findFirst({
        where: { stripeCustomerId: customerId },
        select: { id: true, name: true },
      });
      if (!tenant) break;

      const graceEnds = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          // Grace period; the subscription.updated event that follows Stripe's
          // final retry performs the actual downgrade.
          planExpiresAt: graceEnds,
        },
      });

      // The customer has to know their card failed, or the first they hear of
      // it is their calendar quietly losing Pro.
      const contacts = await getBillingContacts(tenant.id);
      await Promise.all(
        contacts.map((to) =>
          sendPaymentFailed({
            to,
            tenantName: tenant.name,
            amount: formatAmount(invoice.amount_due, invoice.currency),
            updatePaymentUrl: `${getAppBaseUrl()}/admin/settings`,
            graceEnds: graceEnds.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          })
        )
      );

      await captureWarning("payment failed", {
        scope: "stripe.invoice",
        tenantId: tenant.id,
        notified: contacts.length,
      });
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = idOf(invoice.customer);
      if (!customerId) break;

      const tenant = await prisma.tenant.findFirst({
        where: { stripeCustomerId: customerId },
        select: { id: true, name: true, planExpiresAt: true },
      });
      if (!tenant) break;

      // Payment recovered — clear any dunning deadline.
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { planExpiresAt: null },
      });

      const contacts = await getBillingContacts(tenant.id);
      await Promise.all(
        contacts.map((to) =>
          sendPaymentReceipt({
            to,
            tenantName: tenant.name,
            amount: formatAmount(invoice.amount_paid, invoice.currency),
            invoiceUrl: invoice.hosted_invoice_url ?? null,
            periodEnd: formatDate(invoice.period_end),
          })
        )
      );
      break;
    }

    default:
      break;
  }
}

async function notifySubscriptionEnded(tenantId: string, reason: "canceled" | "unpaid") {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });
  if (!tenant) return;

  const contacts = await getBillingContacts(tenantId);
  await Promise.all(
    contacts.map((to) =>
      sendSubscriptionEnded({
        to,
        tenantName: tenant.name,
        reason,
        resubscribeUrl: `${getAppBaseUrl()}/admin/settings`,
      })
    )
  );
}

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/** Map the subscription's price back to one of our plans. */
function planFromSubscription(sub: Stripe.Subscription): PlanKey {
  const priceIds = sub.items.data.map((item) => item.price.id);

  for (const [key, config] of Object.entries(PLANS)) {
    if (config.priceId && priceIds.includes(config.priceId)) {
      return key as PlanKey;
    }
  }

  // An unrecognized price still represents a real payment; treat it as Pro
  // rather than silently giving the customer nothing.
  void captureWarning("unrecognized price on subscription", {
    scope: "stripe.plan",
    subscriptionId: sub.id,
    priceIds: priceIds.join(","),
  });
  return "PRO";
}

async function findTenantForSubscription(sub: Stripe.Subscription) {
  const byMetadata = sub.metadata?.tenantId;
  if (byMetadata) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: byMetadata },
      select: { id: true, stripeCustomerId: true },
    });
    if (tenant) return tenant;
  }

  const bySubscription = await prisma.tenant.findFirst({
    where: { stripeSubscriptionId: sub.id },
    select: { id: true, stripeCustomerId: true },
  });
  if (bySubscription) return bySubscription;

  const customerId = idOf(sub.customer);
  if (!customerId) return null;

  return prisma.tenant.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true, stripeCustomerId: true },
  });
}

function graceDeadline(sub: Stripe.Subscription): Date {
  const periodEnd = sub.items.data[0]?.current_period_end;
  if (periodEnd) return new Date(periodEnd * 1000);
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
}
