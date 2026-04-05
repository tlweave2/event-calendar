"use client";

import type { TenantAnalytics } from "@/lib/analytics";
import { format } from "date-fns";

export default function AnalyticsDashboard({
  analytics,
  plan,
  monthlyLimit,
}: {
  analytics: TenantAnalytics;
  plan: string;
  monthlyLimit: number;
}) {
  const {
    submissionsByMonth,
    statusBreakdown,
    topCategories,
    pageViews,
    topViewedEvents,
    thisMonthCount,
    totalApproved,
    recentActivity,
  } = analytics;

  const maxBar = Math.max(...submissionsByMonth.map((month) => month.count), 1);
  const isFreePlan = plan === "FREE";
  const freeLimit = monthlyLimit;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="This Month"
          value={thisMonthCount}
          sub={isFreePlan ? `of ${freeLimit} free` : "submitted"}
          accent={isFreePlan && thisMonthCount >= freeLimit ? "#dc2626" : "#2563eb"}
        />
        <StatCard label="Total Approved" value={totalApproved} sub="all time" accent="#16a34a" />
        <StatCard label="Pending Review" value={statusBreakdown.pending} sub="in queue" accent="#d97706" />
        <StatCard label="Rejected" value={statusBreakdown.rejected} sub="all time" accent="#6b7280" />
      </div>

      {isFreePlan && (
        <div className="rounded-lg border bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Monthly Event Limit</p>
            <span className="text-sm text-gray-500">
              {thisMonthCount} / {freeLimit}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min((thisMonthCount / freeLimit) * 100, 100)}%`,
                backgroundColor: thisMonthCount >= freeLimit ? "#dc2626" : "#2563eb",
              }}
            />
          </div>
          {thisMonthCount >= freeLimit && (
            <p className="mt-2 text-xs text-red-600">
              Monthly limit reached. <a href="/admin/settings" className="font-medium underline">Upgrade to Pro</a> for unlimited events.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 text-sm font-medium text-gray-700">Submissions - Last 6 Months</h2>
          <div className="flex h-32 items-end gap-2">
            {submissionsByMonth.map(({ label, count }) => (
              <div key={label} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs text-gray-500">{count || ""}</span>
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${Math.max((count / maxBar) * 100, count > 0 ? 4 : 0)}%`,
                    backgroundColor: "#2563eb",
                    opacity: count === 0 ? 0.15 : 1,
                    minHeight: count > 0 ? "4px" : "0",
                  }}
                />
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 text-sm font-medium text-gray-700">Status Breakdown</h2>
          <StatusBreakdown
            pending={statusBreakdown.pending}
            approved={statusBreakdown.approved}
            rejected={statusBreakdown.rejected}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 text-sm font-medium text-gray-700">Top Categories</h2>
          {topCategories.length === 0 ? (
            <p className="text-sm text-gray-400">No approved events yet.</p>
          ) : (
            <div className="space-y-3">
              {topCategories.map((category) => (
                <div key={category.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{category.name}</span>
                    <span className="text-gray-400">{category.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(category.count / topCategories[0].count) * 100}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 text-sm font-medium text-gray-700">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-xs">
                  <span
                    className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      log.action.includes("approved")
                        ? "bg-green-500"
                        : log.action.includes("rejected")
                          ? "bg-red-400"
                          : "bg-blue-400"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-gray-600">{actionLabel(log.action)}</span>
                    {log.user?.email && <span className="text-gray-400"> by {log.user.email}</span>}
                    {log.event?.title && (
                      <span className="block truncate text-gray-400">{log.event.title}</span>
                    )}
                  </div>
                  <span className="shrink-0 text-gray-300">
                    {format(new Date(log.createdAt), "MMM d")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 text-sm font-medium text-gray-700">Public Page Views (All Time)</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Calendar", count: pageViews.calendar },
            { label: "Event Detail", count: pageViews.event },
            { label: "Submit Form", count: pageViews.submit },
          ].map(({ label, count }) => (
            <div key={label} className="rounded-md border p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="mt-0.5 text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {topViewedEvents.length > 0 && (
        <div className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 text-sm font-medium text-gray-700">Top Viewed Events</h2>
          <div className="space-y-3">
            {topViewedEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between text-sm">
                <span className="truncate text-gray-700">{event.title}</span>
                <span className="ml-4 shrink-0 text-gray-400">{event.count} views</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold" style={{ color: accent }}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-gray-400">{sub}</p>
    </div>
  );
}

function StatusBreakdown({
  pending,
  approved,
  rejected,
}: {
  pending: number;
  approved: number;
  rejected: number;
}) {
  const total = pending + approved + rejected;

  if (total === 0) {
    return <p className="text-sm text-gray-400">No events yet.</p>;
  }

  const segments = [
    { label: "Approved", count: approved, color: "#16a34a" },
    { label: "Pending", count: pending, color: "#d97706" },
    { label: "Rejected", count: rejected, color: "#dc2626" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex h-4 overflow-hidden rounded-full bg-gray-100">
        {segments
          .filter((segment) => segment.count > 0)
          .map((segment) => (
            <div
              key={segment.label}
              style={{ width: `${(segment.count / total) * 100}%`, backgroundColor: segment.color }}
            />
          ))}
      </div>

      <div className="space-y-1.5">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: segment.color }} />
              <span className="text-gray-600">{segment.label}</span>
            </div>
            <span className="text-gray-400">
              {segment.count} <span className="text-gray-300">({total > 0 ? Math.round((segment.count / total) * 100) : 0}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    "event.approved": "Approved event",
    "event.rejected": "Rejected event",
    "event.pending": "Event submitted",
    "user.invited": "Invited user",
    "user.invite_accepted": "Accepted invite",
  };

  return map[action] ?? action;
}