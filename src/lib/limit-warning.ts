import { prisma } from "@/lib/prisma";
import { getPlanConfig } from "@/lib/stripe";
import { getBillingContacts } from "@/lib/billing-contacts";
import { sendLimitWarning } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { getAppBaseUrl } from "@/lib/urls";
import { captureError } from "@/lib/observability";

/** Warn once the tenant has used this share of its monthly allowance. */
const WARN_AT = 0.8;

/**
 * Tell a tenant when they are close to their monthly cap, so hitting it is not
 * a surprise that turns submitters away silently.
 *
 * Called after an event is created. Never throws — a warning email must not
 * be able to fail the submission that triggered it.
 */
export async function maybeWarnApproachingLimit(tenantId: string): Promise<void> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, plan: true },
    });
    if (!tenant) return;

    const config = getPlanConfig(tenant.plan);
    if (!Number.isFinite(config.monthlyEvents)) return;

    const used = await prisma.event.count({
      where: { tenantId, createdAt: { gte: startOfMonth() } },
    });

    if (used < Math.ceil(config.monthlyEvents * WARN_AT)) return;

    // One warning per tenant per month. The rate limiter doubles as the
    // dedupe: the first call in the window is the only one allowed through.
    const month = new Date().toISOString().slice(0, 7);
    const gate = await rateLimit(`limit-warning:${tenantId}:${month}`, 1, 60 * 60 * 24 * 31);
    if (!gate.allowed) return;

    const contacts = await getBillingContacts(tenantId);
    await Promise.all(
      contacts.map((to) =>
        sendLimitWarning({
          to,
          tenantName: tenant.name,
          used,
          limit: config.monthlyEvents,
          upgradeUrl: `${getAppBaseUrl()}/admin/settings`,
        })
      )
    );
  } catch (err) {
    await captureError(err, { scope: "limit-warning", tenantId });
  }
}

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
