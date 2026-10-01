"use client";

import { createCheckoutSession, createPortalSession } from "@/lib/actions/billing";
import { Button } from "@/components/ui/button";
import { EVERYTHING_FREE, FLYER_SCANS_PER_MONTH, getPlanConfig } from "@/lib/plans";

const PLAN_SUMMARY: Record<string, string> = {
  FREE: "5 events a month, one person on the account, “Powered by Eventful” shown on your calendar.",
  PRO: "Unlimited events, flyer import, no Eventful branding.",
  ENTERPRISE: "Unlimited events, flyer import, no Eventful branding, up to 25 people on the account.",
};

export default function BillingSection({
  plan,
  hasStripeCustomer,
}: {
  plan: string;
  hasStripeCustomer: boolean;
}) {
  if (EVERYTHING_FREE) {
    return (
      <section className="space-y-3">
        <h2 className="font-medium text-gray-900">Plan</h2>
        <div className="rounded border border-gray-200 bg-white p-5">
          <p className="text-xl font-semibold" style={{ fontFamily: "var(--app-serif)" }}>
            Free, with everything included
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Unlimited events, up to 25 people on the account, no Eventful branding, and{" "}
            {FLYER_SCANS_PER_MONTH} flyer scans a month.
          </p>
          {hasStripeCustomer && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600">
                You have a billing account from an earlier paid plan. You can view invoices or cancel a subscription there.
              </p>
              <form action={createPortalSession}>
                <Button type="submit" variant="outline" size="sm" className="mt-2">
                  Manage billing
                </Button>
              </form>
            </div>
          )}
        </div>
      </section>
    );
  }

  const config = getPlanConfig(plan);
  const planKey = plan in PLAN_SUMMARY ? plan : "FREE";

  return (
    <section className="space-y-3">
      <h2 className="font-medium text-gray-900">Plan and billing</h2>
      <div className="rounded border border-gray-200 bg-white">
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Current plan</p>
          <p className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--app-serif)" }}>
            {config.name}
          </p>
          <p className="mt-1 text-sm text-gray-600">{PLAN_SUMMARY[planKey]}</p>
        </div>

        {planKey === "FREE" && (
          <div className="border-t border-gray-200 p-5">
            <p className="font-medium text-gray-900">Pro, $99 a year</p>
            <p className="mt-1 text-sm text-gray-600">
              Unlimited events, flyer import, and your calendar without Eventful branding.
            </p>
            <form action={createCheckoutSession}>
              <Button type="submit" className="mt-3">
                Upgrade to Pro
              </Button>
            </form>
            <p className="mt-4 text-sm text-gray-600">
              Need more than one person on the account, or an invoice?{" "}
              <a
                href="mailto:support@useventful.com?subject=Eventful%20Enterprise"
                className="font-medium text-gray-900 underline underline-offset-2"
              >
                Ask about Enterprise
              </a>
              .
            </p>
          </div>
        )}

        {planKey === "PRO" && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-gray-200 p-5">
            {hasStripeCustomer && (
              <form action={createPortalSession}>
                <Button type="submit" variant="outline" size="sm">
                  Manage billing
                </Button>
              </form>
            )}
            <a
              href="mailto:support@useventful.com?subject=Eventful%20Enterprise"
              className="text-sm text-gray-600 underline underline-offset-2 hover:text-gray-900"
            >
              Need more people on the account? Ask about Enterprise.
            </a>
          </div>
        )}

        {planKey === "ENTERPRISE" && (
          <div className="border-t border-gray-200 p-5 text-sm text-gray-600">
            Billed by invoice. For changes to your plan or invoice, email{" "}
            <a href="mailto:support@useventful.com" className="font-medium text-gray-900 underline underline-offset-2">
              support@useventful.com
            </a>
            .
          </div>
        )}
      </div>
    </section>
  );
}
