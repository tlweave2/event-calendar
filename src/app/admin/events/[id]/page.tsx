import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getEventById, getCategories } from "@/lib/prisma-tenant";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import EventActions from "./EventActions";
import EditEventForm from "./EditEventForm";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const [event, categories] = await Promise.all([
    getEventById(session.user.tenantId, id),
    getCategories(session.user.tenantId),
  ]);
  if (!event) notFound();

  const siblings = event.seriesId
    ? await prisma.event.findMany({
        where: {
          seriesId: event.seriesId,
          id: { not: event.id },
          tenantId: session.user.tenantId,
        },
        select: {
          id: true,
          startAt: true,
          seriesIndex: true,
          status: true,
        },
        orderBy: { seriesIndex: "asc" },
      })
    : [];

  return (
    <div className="max-w-3xl space-y-6 px-8 py-8">
      <div className="mb-6">
        <Link href="/admin/events" className="text-sm text-gray-400 hover:text-gray-600">
          ← All Events
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        {event.imageUrl && (
          <Image
            src={event.imageUrl}
            alt={event.title}
            width={1200}
            height={384}
            className="h-48 w-full object-cover"
          />
        )}

        <div className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-semibold text-gray-900">{event.title}</h1>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium
                  ${
                    event.status === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : event.status === "REJECTED"
                        ? "bg-red-100 text-red-600"
                        : "bg-amber-100 text-amber-700"
                  }`}
              >
                {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
              </span>
              {event.seriesId && (
                <span className="inline-flex shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                  Recurring
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="mb-0.5 text-xs uppercase tracking-wide text-gray-400">Start</p>
              <p className="text-gray-700">
                {format(new Date(event.startAt), "MMM d, yyyy · h:mm a")}
              </p>
            </div>

            {event.endAt && (
              <div>
                <p className="mb-0.5 text-xs uppercase tracking-wide text-gray-400">End</p>
                <p className="text-gray-700">
                  {format(new Date(event.endAt), "MMM d, yyyy · h:mm a")}
                </p>
              </div>
            )}

            {event.locationName && (
              <div>
                <p className="mb-0.5 text-xs uppercase tracking-wide text-gray-400">
                  Location
                </p>
                <p className="text-gray-700">{event.locationName}</p>
              </div>
            )}

            {event.category && (
              <div>
                <p className="mb-0.5 text-xs uppercase tracking-wide text-gray-400">
                  Category
                </p>
                <p className="text-gray-700">{event.category.name}</p>
              </div>
            )}

            {event.cost && (
              <div>
                <p className="mb-0.5 text-xs uppercase tracking-wide text-gray-400">Cost</p>
                <p className="text-gray-700">{event.cost}</p>
              </div>
            )}

            {event.ticketUrl && (
              <div>
                <p className="mb-0.5 text-xs uppercase tracking-wide text-gray-400">Tickets</p>
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-blue-600 underline"
                >
                  {event.ticketUrl}
                </a>
              </div>
            )}
          </div>

          {event.description && (
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">Description</p>
              <p className="whitespace-pre-wrap text-sm text-gray-700">{event.description}</p>
            </div>
          )}

          <div className="border-t pt-4">
            <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">Submitted by</p>
            <p className="text-sm text-gray-700">
              {event.submitterName}
              {" "}
              {event.submitterEmail && (
                <span className="text-gray-400">({event.submitterEmail})</span>
              )}
            </p>
          </div>

          <EventActions eventId={event.id} currentStatus={event.status} />
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Edit event</h2>
        <EditEventForm
          event={event}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          seriesId={event.seriesId ?? null}
          seriesIndex={event.seriesIndex ?? null}
        />
      </div>

      {siblings.length > 0 && (
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Series instances
            <span className="ml-2 text-sm font-normal text-gray-400">
              {siblings.length + 1} total
            </span>
          </h2>
          <SeriesList siblings={siblings} />
        </div>
      )}
    </div>
  );
}

function SeriesList({
  siblings,
}: {
  siblings: Array<{
    id: string;
    startAt: Date;
    seriesIndex: number | null;
    status: string;
  }>;
}) {
  const previewCount = 3;
  const preview = siblings.slice(0, previewCount);
  const rest = siblings.slice(previewCount);

  const rowClass = "flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-50";

  const StatusBadge = ({ status }: { status: string }) => (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        status === "APPROVED"
          ? "bg-green-100 text-green-700"
          : status === "REJECTED"
            ? "bg-red-100 text-red-600"
            : "bg-amber-100 text-amber-700"
      }`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );

  return (
    <div className="space-y-1">
      {preview.map((sibling) => (
        <Link
          key={sibling.id}
          href={`/admin/events/${sibling.id}`}
          className={rowClass}
        >
          <span className="text-gray-700">
            #{sibling.seriesIndex ?? "?"} · {format(new Date(sibling.startAt), "EEE, MMM d, yyyy · h:mm a")}
          </span>
          <StatusBadge status={sibling.status} />
        </Link>
      ))}

      {rest.length > 0 && (
        <details className="group">
          <summary className="list-none cursor-pointer px-3 py-2 text-sm text-gray-400 hover:text-gray-600">
            <span className="group-open:hidden">
              + {rest.length} more instance{rest.length !== 1 ? "s" : ""}
            </span>
            <span className="hidden group-open:inline">Show less</span>
          </summary>
          <div className="space-y-1">
            {rest.map((sibling) => (
              <Link
                key={sibling.id}
                href={`/admin/events/${sibling.id}`}
                className={rowClass}
              >
                <span className="text-gray-700">
                  #{sibling.seriesIndex ?? "?"} · {format(new Date(sibling.startAt), "EEE, MMM d, yyyy · h:mm a")}
                </span>
                <StatusBadge status={sibling.status} />
              </Link>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}