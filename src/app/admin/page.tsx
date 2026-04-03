import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPendingEvents } from "@/lib/prisma-tenant";
import QueueRow from "./QueueRow";

export default async function AdminQueuePage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const events = await getPendingEvents(session.user.tenantId);

  return (
    <div className="max-w-4xl px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Pending Queue</h1>
        <p className="mt-1 text-sm text-gray-500">
          {events.length === 0
            ? "No events pending review."
            : `${events.length} event${events.length !== 1 ? "s" : ""} waiting for review`}
        </p>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <QueueRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
