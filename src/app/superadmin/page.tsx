import Link from "next/link";
import { redirect } from "next/navigation";
import { isSuperadmin } from "@/lib/superadmin";
import { getOperatorDashboard, type TenantRow } from "@/lib/operator-metrics";
import { superadminLogout } from "@/lib/actions/superadmin-auth";
import { setTenantPlan } from "@/lib/actions/superadmin-plan";

export const dynamic = "force-dynamic";
export const metadata = { title: "Operator console" };

export default async function SuperadminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; changed?: string }>;
}) {
  if (!(await isSuperadmin())) redirect("/superadmin/login");

  const { error, changed } = await searchParams;
  const { summary, rows } = await getOperatorDashboard();

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-8 text-gray-200">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Operator console</h1>
            <p className="mt-1 text-sm text-gray-500">
              Every tenant across the platform. Demo sandboxes are excluded from
              the numbers below.
            </p>
          </div>
          <form action={superadminLogout}>
            <button className="rounded-md border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-900">
              Sign out
            </button>
          </form>
        </header>

        {changed && (
          <p className="mb-4 rounded-md border border-green-900 bg-green-950 px-4 py-3 text-sm text-green-200">
            Plan updated for {changed}.
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-md border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="ARR" value={`$${summary.arrUsd.toLocaleString()}`} sub={`$${summary.mrrUsd.toLocaleString()}/mo equivalent`} />
          <Stat label="Paying" value={summary.payingTenants} sub={`of ${summary.tenants} tenants`} />
          <Stat label="New (30d)" value={summary.signupsLast30Days} sub="signups" />
          <Stat label="Events (30d)" value={summary.eventsLast30Days} sub="platform-wide" />
        </section>

        <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            label="At free limit"
            value={summary.tenantsAtLimit}
            sub="upgrade conversations"
            accent={summary.tenantsAtLimit > 0 ? "amber" : undefined}
          />
          <Stat
            label="Inactive 30d"
            value={summary.staleTenants}
            sub="churn risk"
            accent={summary.staleTenants > 0 ? "red" : undefined}
          />
          <Stat
            label="Failed webhooks"
            value={summary.failedWebhooks}
            sub="gave up, last 30d"
            accent={summary.failedWebhooks > 0 ? "red" : undefined}
          />
          <Stat label="Demo sandboxes" value={summary.demoTenants} sub="live now" />
        </section>

        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-gray-900 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Events (mo)</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Seats</th>
                <th className="px-4 py-3 font-medium">Queue</th>
                <th className="px-4 py-3 font-medium">Last activity</th>
                <th className="px-4 py-3 font-medium">Signed up</th>
                <th className="px-4 py-3 font-medium">Change plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {rows.map((row) => (
                <TenantTableRow key={row.id} row={row} />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No tenants yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-gray-600">
          Plan changes here bypass Stripe. A tenant with a live subscription will
          be moved back by its next subscription webhook — cancel in Stripe first
          if the change should stick.
        </p>
      </div>
    </div>
  );
}

function TenantTableRow({ row }: { row: TenantRow }) {
  const limit = Number.isFinite(row.monthlyLimit) ? row.monthlyLimit : null;

  return (
    <tr className={row.isDemo ? "bg-gray-950/60 text-gray-500" : "text-gray-300"}>
      <td className="px-4 py-3">
        <Link
          href={`/embed/${row.slug}/calendar`}
          className="font-medium text-white hover:underline"
          target="_blank"
        >
          {row.name}
        </Link>
        <p className="text-xs text-gray-500">
          /{row.slug}
          {row.isDemo && " · demo"}
        </p>
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            row.plan === "FREE"
              ? "bg-gray-800 text-gray-400"
              : "bg-blue-950 text-blue-300"
          }`}
        >
          {row.plan}
        </span>
      </td>
      <td className={`px-4 py-3 ${row.atLimit ? "font-semibold text-amber-400" : ""}`}>
        {row.eventsThisMonth}
        {limit !== null && <span className="text-gray-600"> / {limit}</span>}
      </td>
      <td className="px-4 py-3 text-gray-400">{row.eventsTotal}</td>
      <td className="px-4 py-3 text-gray-400">{row.seatsUsed}</td>
      <td className="px-4 py-3">
        {row.pendingEvents > 0 ? (
          <span className="text-amber-400">{row.pendingEvents} pending</span>
        ) : (
          <span className="text-gray-600">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-gray-400">{relative(row.lastActivityAt)}</td>
      <td className="px-4 py-3 text-gray-500">{row.createdAt.toISOString().slice(0, 10)}</td>
      <td className="px-4 py-3">
        <form action={setTenantPlan} className="flex items-center gap-1">
          <input type="hidden" name="tenantId" value={row.id} />
          <select
            name="plan"
            defaultValue={row.plan}
            className="rounded border border-gray-700 bg-gray-950 px-2 py-1 text-xs text-gray-200"
          >
            <option value="FREE">FREE</option>
            <option value="PRO">PRO</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>
          <button className="rounded border border-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-900">
            Set
          </button>
        </form>
      </td>
    </tr>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "amber" | "red";
}) {
  const accentClass =
    accent === "amber" ? "text-amber-400" : accent === "red" ? "text-red-400" : "text-white";

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accentClass}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-600">{sub}</p>}
    </div>
  );
}

function relative(date: Date | null): string {
  if (!date) return "never";
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
