"use server";

import { getStripe, PLANS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { isDemoTenant } from "@/lib/demo-guard";
import { authorize } from "@/lib/authz";
import { getAppBaseUrl } from "@/lib/urls";

function settingsError(message: string): never {
  redirect(`/admin/settings?billing_error=${encodeURIComponent(message)}`);
}

export async function createCheckoutSession(formData: FormData): Promise<void> {
  void formData;

  // Billing is owner-only: a subscription change is a financial action, not a
  // content edit.
  const authorized = await authorize("billing:manage");
  if (!authorized.ok) settingsError(authorized.error);

  const tenant = await prisma.tenant.findUnique({
    where: { id: authorized.ctx.tenantId },
  });
  if (!tenant) settingsError("Workspace not found.");

  if (isDemoTenant(tenant.id, tenant.slug)) {
    redirect("/admin/settings?demo=1");
  }

  const priceId = PLANS.PRO.priceId;
  if (!priceId) {
    settingsError("Billing is not configured. Please contact support.");
  }

  const baseUrl = getAppBaseUrl();

  let checkoutUrl: string;
  try {
    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { tenantId: tenant.id },
      // Reuse the existing customer so a returning subscriber does not end up
      // with duplicate Stripe customer records.
      ...(tenant.stripeCustomerId
        ? { customer: tenant.stripeCustomerId }
        : { customer_email: authorized.ctx.email }),
      subscription_data: { metadata: { tenantId: tenant.id } },
      success_url: `${baseUrl}/admin/settings?upgraded=1`,
      cancel_url: `${baseUrl}/admin/settings?cancelled=1`,
    });

    if (!checkoutSession.url) {
      settingsError("Stripe did not return a checkout URL. Please try again.");
    }
    checkoutUrl = checkoutSession.url;
  } catch (err) {
    // redirect() throws internally; let those pass through untouched.
    if (isRedirectError(err)) throw err;
    console.error("[billing] checkout session failed:", err);
    settingsError("Could not start checkout. Please try again.");
  }

  redirect(checkoutUrl);
}

export async function createPortalSession(formData: FormData): Promise<void> {
  void formData;

  const authorized = await authorize("billing:manage");
  if (!authorized.ok) settingsError(authorized.error);

  const tenant = await prisma.tenant.findUnique({
    where: { id: authorized.ctx.tenantId },
  });
  if (!tenant) settingsError("Workspace not found.");

  if (isDemoTenant(tenant.id, tenant.slug)) {
    redirect("/admin/settings?demo=1");
  }

  if (!tenant.stripeCustomerId) {
    settingsError("No billing account yet. Upgrade to a paid plan first.");
  }

  let portalUrl: string;
  try {
    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${getAppBaseUrl()}/admin/settings`,
    });
    portalUrl = portalSession.url;
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("[billing] portal session failed:", err);
    settingsError("Could not open the billing portal. Please try again.");
  }

  redirect(portalUrl);
}

function isRedirectError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}
