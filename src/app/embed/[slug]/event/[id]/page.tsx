import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { getEventById } from "@/lib/prisma-tenant";

type Props = {
  params: Promise<{ slug: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return {};

  const event = await getEventById(tenant.id, id);
  if (!event) return {};

  const description =
    event.description ?? `${event.title} at ${event.locationName ?? tenant.name}`;

  return {
    title: `${event.title} - ${tenant.name}`,
    description,
    openGraph: {
      title: event.title,
      description,
      images: event.imageUrl ? [{ url: event.imageUrl, width: 1200, height: 630 }] : [],
      type: "website",
    },
    twitter: {
      card: event.imageUrl ? "summary_large_image" : "summary",
      title: event.title,
      description,
      images: event.imageUrl ? [event.imageUrl] : [],
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const event = await getEventById(tenant.id, id);
  if (!event) notFound();

  const accent = tenant.primaryColor ?? "#2563eb";
  const calendarUrl = `/embed/${slug}/calendar`;
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://event-calendar-oglq.vercel.app";
  const eventUrl = `${baseUrl}/embed/${slug}/event/${id}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link
            href={calendarUrl}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to calendar
          </Link>
          {tenant.logoUrl && (
            <img src={tenant.logoUrl} alt={tenant.name} className="h-8 object-contain" />
          )}
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        {event.imageUrl && (
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full object-contain"
              style={{ maxHeight: "500px" }}
            />
          </div>
        )}

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div
            className="h-1.5"
            style={{ backgroundColor: event.category?.color ?? accent }}
          />

          <div className="space-y-5 p-6">
            <div>
              {event.category && (
                <span
                  className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${event.category.color}22`,
                    color: event.category.color ?? accent,
                  }}
                >
                  {event.category.name}
                </span>
              )}
              <h1 className="text-2xl font-semibold text-gray-900">{event.title}</h1>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="text-lg">📅</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {format(new Date(event.startAt), "EEEE, MMMM d, yyyy")}
                  </p>
                  <p className="text-gray-500">
                    {format(new Date(event.startAt), "h:mm a")}
                    {event.endAt && ` - ${format(new Date(event.endAt), "h:mm a")}`}
                  </p>
                </div>
              </div>

              {event.locationName && (
                <div className="flex gap-3">
                  <span className="text-lg">📍</span>
                  <div>
                    <p className="font-medium text-gray-900">{event.locationName}</p>
                    {event.address && (
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm underline"
                        style={{ color: accent }}
                      >
                        {event.address} →
                      </a>
                    )}
                  </div>
                </div>
              )}

              {event.cost && (
                <div className="flex gap-3">
                  <span className="text-lg">💰</span>
                  <p className="font-medium text-gray-900">{event.cost}</p>
                </div>
              )}
            </div>

            {event.description && (
              <div className="border-t pt-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                  {event.description}
                </p>
              </div>
            )}

            {event.ticketUrl && (
              <div className="border-t pt-4">
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg py-3 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: accent }}
                >
                  Tickets / Register →
                </a>
              </div>
            )}

            <div className="border-t pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                Share this event
              </p>
              <ShareButtons url={eventUrl} title={event.title} />
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href={calendarUrl} className="text-sm underline" style={{ color: accent }}>
            View all events →
          </Link>
        </div>
      </div>
    </div>
  );
}

function ShareButtons({ url, title }: { url: string; title: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
      >
        Share on Facebook
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
      >
        Share on X
      </a>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
      >
        WhatsApp
      </a>
    </div>
  );
}
