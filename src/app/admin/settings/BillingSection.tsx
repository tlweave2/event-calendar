"use client";

import { createCheckoutSession, createPortalSession } from "@/lib/actions/billing";
import { PRO_PRICE_USD, YEARLY_MONTHS_FREE } from "@/lib/pricing";
import { Button } from "@/components/ui/button";

export default function BillingSection({
  plan,
  hasStripeCustomer,
  billingError,
}: {
  plan: string;
  hasStripeCustomer: boolean;
  billingError?: string;
}) {
  const isPro = plan === "PRO";

  return (
    <section className="space-y-3">
      <h2 className="font-medium text-gray-900">Plan & Billing</h2>
      <div className="space-y-4 rounded-lg border bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">
              {isPro ? "Pro Plan" : "Free Plan"}
            </p>
            <p className="mt-0.5 text-sm text-gray-500">
              {isPro
                ? "Unlimited events, AI flyer scanning, custom branding"
                : "5 events/month, Powered by Eventful badge"}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              isPro ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            {isPro ? "PRO" : "FREE"}
          </span>
        </div>

        {!isPro && (
          <div className="space-y-3 border-t pt-4">
            <p className="font-medium text-gray-900">Upgrade to Pro</p>
            <ul className="space-y-1 text-sm text-gray-500">
              <li>✓ Unlimited events</li>
              <li>✓ AI flyer scanning</li>
              <li>✓ Custom branding (remove badge)</li>
            </ul>

            {billingError === "not_configured" ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Checkout isn&apos;t set up on this server yet. Please try again later.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                <form action={createCheckoutSession}>
                  <input type="hidden" name="interval" value="yearly" />
                  <Button type="submit">
                    ${PRO_PRICE_USD.yearly}/year
                  </Button>
                </form>
                <form action={createCheckoutSession}>
                  <input type="hidden" name="interval" value="monthly" />
                  <Button type="submit" variant="outline">
                    ${PRO_PRICE_USD.monthly}/month
                  </Button>
                </form>
              </div>
            )}

            <p className="text-xs text-gray-400">
              Paying yearly works out to about ${(PRO_PRICE_USD.yearly / 12).toFixed(2)} a
              month — {YEARLY_MONTHS_FREE} months free. Cancel any time.
            </p>
          </div>
        )}

        {isPro && hasStripeCustomer && (
          <div className="border-t pt-4">
            <form action={createPortalSession}>
              <Button type="submit" variant="outline" size="sm">
                Manage Billing
              </Button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}