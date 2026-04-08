import { getTenantBySlug } from "@/lib/tenant";
import { getEventById } from "@/lib/prisma-tenant";
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
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return notFound();

  const event = await getEventById(tenant.id, id);
  if (!event) return notFound();

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://www.useventful.com";
  const url = `${baseUrl}/embed/${slug}/event/${id}`;
  const end = event.endAt
    ? new Date(event.endAt)
    : new Date(new Date(event.startAt).getTime() + 60 * 60 * 1000);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//Eventful//${tenant.name}//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@eventful`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `DTSTART:${formatICalDate(new Date(event.startAt))}`,
    `DTEND:${formatICalDate(end)}`,
    `SUMMARY:${escapeICalText(event.title)}`,
    event.description ? `DESCRIPTION:${escapeICalText(event.description)}` : null,
    event.locationName
      ? `LOCATION:${escapeICalText(event.address ? `${event.locationName}, ${event.address}` : event.locationName)}`
      : null,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new Response(lines, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.title.replace(/[^a-z0-9]/gi, "-")}.ics"`,
    },
  });
}
