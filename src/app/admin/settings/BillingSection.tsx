"use client";

import { createCheckoutSession, createPortalSession } from "@/lib/actions/billing";
import { Button } from "@/components/ui/button";

export default function BillingSection({
  plan,
  hasStripeCustomer,
}: {
  plan: string;
  hasStripeCustomer: boolean;
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
                ? "Unlimited events, custom domain, full API access"
                : "25 events/month, 1 admin user, platform badge"}
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
          <div className="space-y-2 border-t pt-4">
            <p className="font-medium text-gray-900">Upgrade to Pro - $49/mo</p>
            <ul className="space-y-1 text-sm text-gray-500">
              <li>✓ Unlimited events</li>
              <li>✓ Up to 5 admin users</li>
              <li>✓ Custom domain</li>
              <li>✓ Remove platform badge</li>
              <li>✓ Read-only API access</li>
              <li>✓ Priority support</li>
            </ul>
            <form action={createCheckoutSession}>
              <Button type="submit" className="mt-2">
                Upgrade to Pro →
              </Button>
            </form>
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