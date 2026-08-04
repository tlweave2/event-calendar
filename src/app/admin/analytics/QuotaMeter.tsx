import Link from "next/link";

/**
 * Monthly event quota. Shown to Free tenants on the analytics page, which is
 * otherwise a Pro feature — the quota is the one number a Free tenant needs,
 * and it is the natural place to put the upgrade.
 */
export default function QuotaMeter({ used, limit }: { used: number; limit: number }) {
  if (!Number.isFinite(limit)) return null;

  const atLimit = used >= limit;
  const pct = Math.min((used / limit) * 100, 100);

  return (
    <div className="rounded-lg border bg-white p-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Monthly Event Limit</p>
        <span className="text-sm text-gray-500">
          {used} / {limit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: atLimit ? "#dc2626" : "#2563eb",
          }}
        />
      </div>
      {atLimit && (
        <p className="mt-2 text-xs text-red-600">
          Monthly limit reached.{" "}
          <Link href="/admin/settings" className="font-medium underline">
            Upgrade to Pro
          </Link>{" "}
          for unlimited events.
        </p>
      )}
    </div>
  );
}
