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
        <div className="flex items-center gap-3">
          <Link
            href="/admin/events/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Create Event
          </Link>
          <Link
            href="/api/export/events"
            className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Export CSV
          </Link>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 py-12 text-center">
          <p className="text-gray-500">No events yet.</p>
          <Link
            href="/admin/events/new"
            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Create your first event →
          </Link>
        </div>
      ) : (
        <BulkActions
          events={events.map((event) => ({
            id: event.id,
            title: event.title,
            seriesId: event.seriesId,
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