import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEvents } from "@/lib/prisma-tenant";
import Link from "next/link";
import BulkActions from "./BulkActions";

export default async function AllEventsPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const events = await getEvents(session.user.tenantId);

  return (
    <div className="max-w-5xl px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">All Events</h1>
          <p className="mt-1 text-sm text-gray-500">
            {events.length} total event{events.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/api/export/events"
          className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Export CSV
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="py-12 text-center text-gray-400">No events yet.</p>
      ) : (
        <BulkActions
          events={events.map((event) => ({
            id: event.id,
            title: event.title,
            startAt: event.startAt,
            category: event.category ? { name: event.category.name } : null,
            submitterName: event.submitterName,
            submitterEmail: event.submitterEmail,
            status: event.status,
          }))}
        />
      )}
    </div>
  );
}