import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTenantAnalytics } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/stripe";
import AnalyticsDashboard from "./AnalyticsDashboard";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const [analytics, tenant] = await Promise.all([
    getTenantAnalytics(session.user.tenantId),
    prisma.tenant.findUnique({ where: { id: session.user.tenantId } }),
  ]);

  return (
    <div className="max-w-5xl px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Activity overview for {tenant?.name}
        </p>
      </div>
      <AnalyticsDashboard
        analytics={analytics}
        plan={tenant?.plan ?? "FREE"}
        monthlyLimit={tenant?.plan === "FREE" ? PLANS.FREE.monthlyEvents : Infinity}
      />
    </div>
  );
}