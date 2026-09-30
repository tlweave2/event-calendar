import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPendingEvents } from "@/lib/prisma-tenant";
import { checkEventLimit } from "@/lib/plan-limits";
import QueueRow from "./QueueRow";

export default async function AdminQueuePage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const [events, limitCheck] = await Promise.all([
    getPendingEvents(session.user.tenantId),
    checkEventLimit(session.user.tenantId),
  ]);

  const nearLimit =
    limitCheck.plan === "FREE" &&
    limitCheck.limit !== Infinity &&
    limitCheck.current >= limitCheck.limit * 0.8;

  const atLimit =
    limitCheck.plan === "FREE" && limitCheck.limit !== Infinity && !limitCheck.allowed;

  return (
    <div className="max-w-4xl px-8 py-8">
      {atLimit && (
        <div className="mb-6 border-l-2 border-red-700 bg-white px-4 py-3">
          <p className="text-sm font-medium text-red-800">
            Monthly limit reached ({limitCheck.current}/{limitCheck.limit} events)
          </p>
          <p className="mt-0.5 text-sm text-gray-600">
            New submissions are paused until next month or you{" "}
            <a href="/admin/settings" className="font-medium underline">
              upgrade to Pro
            </a>
            .
          </p>
        </div>
      )}

      {nearLimit && !atLimit && (
        <div className="mb-6 border-l-2 border-amber-600 bg-white px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            Approaching monthly limit ({limitCheck.current}/{limitCheck.limit} events)
          </p>
          <p className="mt-0.5 text-sm text-gray-600">
            <a href="/admin/settings" className="font-medium underline">
              Upgrade to Pro
            </a>{" "}
            for unlimited events.
          </p>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Review queue</h1>
        <p className="mt-1 text-sm text-gray-500">
          {events.length === 0
            ? "Nothing waiting. New submissions will show up here."
            : `${events.length} event${events.length !== 1 ? "s" : ""} waiting for you`}
        </p>
      </div>

      {events.length > 0 && (
        <ol className="border-y border-gray-900 bg-white">
          {events.map((event) => (
            <QueueRow key={event.id} event={event} />
          ))}
        </ol>
      )}
    </div>
  );
}
