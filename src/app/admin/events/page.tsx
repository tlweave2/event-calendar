import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEvents } from "@/lib/prisma-tenant";
import { format } from "date-fns";
import Link from "next/link";
import { EventStatus } from "@prisma/client";

const STATUS_STYLES: Record<EventStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

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
      </div>

      {events.length === 0 ? (
        <p className="py-12 text-center text-gray-400">No events yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 text-left font-medium">Event</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Submitted by</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="max-w-xs truncate px-4 py-3 font-medium text-gray-900">
                    <Link href={`/admin/events/${event.id}`} className="hover:underline">
                      {event.title}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {format(new Date(event.startAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {event.category?.name ?? <span className="text-gray-300">-</span>}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-gray-500">
                    {event.submitterName ?? "-"}
                    {event.submitterEmail && (
                      <span className="ml-1 text-gray-400">({event.submitterEmail})</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[event.status]}`}
                    >
                      {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}