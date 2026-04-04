import { auth } from "@/lib/auth";
import { getEvents } from "@/lib/prisma-tenant";
import type { EventWithCategory } from "@/lib/prisma-tenant";

function escapeCsv(value: string | null | undefined) {
  const text = value ?? "";
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET() {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const events: EventWithCategory[] = await getEvents(session.user.tenantId);

  const rows = [
    [
      "Title",
      "Start",
      "End",
      "Status",
      "Category",
      "Location",
      "Submitter Name",
      "Submitter Email",
      "Cost",
      "Ticket URL",
    ].join(","),
    ...events.map((event: EventWithCategory) =>
      [
        escapeCsv(event.title),
        escapeCsv(event.startAt.toISOString()),
        escapeCsv(event.endAt?.toISOString()),
        escapeCsv(event.status),
        escapeCsv(event.category?.name),
        escapeCsv(event.locationName),
        escapeCsv(event.submitterName),
        escapeCsv(event.submitterEmail),
        escapeCsv(event.cost),
        escapeCsv(event.ticketUrl),
      ].join(",")
    ),
  ];

  return new Response(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="events.csv"',
    },
  });
}