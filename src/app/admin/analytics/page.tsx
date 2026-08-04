import Link from "next/link";
import { requireSession } from "@/lib/authz";
import { getTenantAnalytics } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { getPlanConfig, hasFeature } from "@/lib/stripe";
import AnalyticsDashboard from "./AnalyticsDashboard";
import QuotaMeter from "./QuotaMeter";

export default async function AnalyticsPage() {
  const session = await requireSession();

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { name: true, plan: true },
  });

  const plan = tenant?.plan ?? "FREE";
  const config = getPlanConfig(plan);

  // Analytics is a Pro feature. Free tenants still get their quota meter —
  // it is the number they most need, and it is where the upgrade belongs.
  if (!hasFeature(plan, "analytics")) {
    const thisMonthCount = await prisma.event.count({
      where: { tenantId: session.tenantId, createdAt: { gte: startOfMonth() } },
    });

    return (
      <div className="max-w-5xl px-8 py-8">
        <Header tenantName={tenant?.name} />
        <QuotaMeter used={thisMonthCount} limit={config.monthlyEvents} />

        <div className="mt-6 rounded-lg border bg-white p-6">
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
            Pro
          </span>
          <h2 className="mt-3 font-semibold text-gray-900">
            See how your calendar is performing
          </h2>
          <p className="mt-2 max-w-lg text-sm text-gray-500">
            Submissions over time, approval rates, most-viewed events, and which
            categories draw the most interest. Available on Pro.
          </p>
          <Link
            href="/admin/settings"
            className="mt-4 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  const analytics = await getTenantAnalytics(session.tenantId);

  return (
    <div className="max-w-5xl px-8 py-8">
      <Header tenantName={tenant?.name} />
      <AnalyticsDashboard
        analytics={analytics}
        plan={plan}
        monthlyLimit={config.monthlyEvents}
      />
    </div>
  );
}

function Header({ tenantName }: { tenantName?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
      <p className="mt-1 text-sm text-gray-500">
        Activity overview for {tenantName}
      </p>
    </div>
  );
}

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
