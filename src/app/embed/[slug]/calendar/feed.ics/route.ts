import { getTenantBySlug } from "@/lib/tenant";
import { getApprovedEvents } from "@/lib/prisma-tenant";
import { notFound } from "next/navigation";

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return notFound();

  const events = await getApprovedEvents(tenant.id);
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://www.useventful.com";

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//Eventful//${tenant.name}//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICalText(tenant.name)}`,
    `X-WR-CALDESC:Events from ${escapeICalText(tenant.name)}`,
    "X-WR-TIMEZONE:UTC",
  ];

  for (const event of events) {
    const uid = `${event.id}@eventful`;
    const url = `${baseUrl}/embed/${slug}/event/${event.id}`;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${formatICalDate(new Date())}`);
    lines.push(`DTSTART:${formatICalDate(new Date(event.startAt))}`);

    if (event.endAt) {
      lines.push(`DTEND:${formatICalDate(new Date(event.endAt))}`);
    } else {
      const end = new Date(event.startAt);
      end.setHours(end.getHours() + 1);
      lines.push(`DTEND:${formatICalDate(end)}`);
    }

    lines.push(`SUMMARY:${escapeICalText(event.title)}`);

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
    }

    if (event.locationName) {
      const location = event.address
        ? `${event.locationName}, ${event.address}`
        : event.locationName;
      lines.push(`LOCATION:${escapeICalText(location)}`);
    }

    if (event.ticketUrl) {
      lines.push(`URL:${event.ticketUrl}`);
    } else {
      lines.push(`URL:${url}`);
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-events.ics"`,
      "Cache-Control": "no-cache",
    },
  });
}
