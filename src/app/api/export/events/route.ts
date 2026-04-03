import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const events = await prisma.event.findMany({
    where: { tenantId: session.user.tenantId },
    include: { category: true },
    orderBy: [{ startAt: "desc" }, { createdAt: "desc" }],
  });

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
    ...events.map((event) =>
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