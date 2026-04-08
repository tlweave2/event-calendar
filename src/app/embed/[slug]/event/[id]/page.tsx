import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { getEventById } from "@/lib/prisma-tenant";
import { recordPageView } from "@/lib/page-views";

type Props = {
  params: Promise<{ slug: string; id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

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

export default async function EventPage({ params, searchParams }: Props) {
  const { slug, id } = await params;
  const sp = (await searchParams) ?? {};
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const event = await getEventById(tenant.id, id);
  if (!event) notFound();

  void recordPageView(tenant.id, "event", event.id);

  // Embed settings: query params override tenant defaults.
  const fontParam = Array.isArray(sp.font) ? sp.font[0] : sp.font;
  const bgParam = Array.isArray(sp.bg) ? sp.bg[0] : sp.bg;
  const darkParam = Array.isArray(sp.dark) ? sp.dark[0] : sp.dark;

  const font = fontParam ?? tenant.embedFontFamily ?? undefined;
  const bgColor = bgParam ?? tenant.embedBgColor ?? undefined;
  const darkMode = darkParam === "true" || (!darkParam && Boolean(tenant.embedDarkMode));

  const fontLink =
    font && font !== "system-ui"
      ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600;700&display=swap`
      : null;

  const bgStyle =
    bgColor === "transparent"
      ? "transparent"
      : bgColor ?? (darkMode ? "#111827" : "#f9fafb");

  const accent = tenant.primaryColor ?? "#2563eb";
  const calendarUrl = `/embed/${slug}/calendar`;
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://www.useventful.com";
  const eventUrl = `${baseUrl}/embed/${slug}/event/${id}`;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: bgStyle,
        fontFamily: font ? `"${font}", system-ui, sans-serif` : undefined,
        color: darkMode ? "#f3f4f6" : undefined,
      }}
    >
      {fontLink && <link rel="stylesheet" href={fontLink} />}

      <div className={`border-b px-4 py-4 ${darkMode ? "border-gray-700 bg-gray-800" : "bg-white"}`}>
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link
            href={calendarUrl}
            className={`text-sm ${darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`}
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
          <div
            className={`overflow-hidden rounded-xl border shadow-sm ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
          >
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full object-contain"
              style={{ maxHeight: "500px" }}
            />
          </div>
        )}

        <div
          className={`overflow-hidden rounded-xl border shadow-sm ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
        >
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
              <h1 className={`text-2xl font-semibold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
                {event.title}
              </h1>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="text-lg">📅</span>
                <div>
                  <p className={`font-medium ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
                    {format(new Date(event.startAt), "EEEE, MMMM d, yyyy")}
                  </p>
                  <p className={darkMode ? "text-gray-300" : "text-gray-500"}>
                    {format(new Date(event.startAt), "h:mm a")}
                    {event.endAt && ` - ${format(new Date(event.endAt), "h:mm a")}`}
                  </p>
                </div>
              </div>

              {event.locationName && (
                <div className="flex gap-3">
                  <span className="text-lg">📍</span>
                  <div>
                    <p className={`font-medium ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
                      {event.locationName}
                    </p>
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
                  <p className={`font-medium ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
                    {event.cost}
                  </p>
                </div>
              )}
            </div>

            {event.description && (
              <div className={`border-t pt-4 ${darkMode ? "border-gray-700" : ""}`}>
                <p
                  className={`whitespace-pre-wrap text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                >
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

            <div className={`border-t pt-4 ${darkMode ? "border-gray-700" : ""}`}>
              <p
                className={`mb-2 text-xs font-medium uppercase tracking-wide ${darkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                Add to your calendar
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/embed/${slug}/event/${event.id}/calendar.ics`}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  Apple Calendar / Outlook (.ics)
                </a>
                <a
                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatICalDate(new Date(event.startAt))}/${formatICalDate(event.endAt ? new Date(event.endAt) : new Date(new Date(event.startAt).getTime() + 3600000))}&details=${encodeURIComponent(event.description ?? "")}&location=${encodeURIComponent(event.locationName ?? "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  Google Calendar
                </a>
              </div>
            </div>

            <div className={`border-t pt-4 ${darkMode ? "border-gray-700" : ""}`}>
              <p
                className={`mb-2 text-xs font-medium uppercase tracking-wide ${darkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                Share this event
              </p>
              <ShareButtons url={eventUrl} title={event.title} darkMode={darkMode} />
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

function ShareButtons({
  url,
  title,
  darkMode = false,
}: {
  url: string;
  title: string;
  darkMode?: boolean;
}) {
  const btnClass = darkMode
    ? "rounded-md border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700"
    : "rounded-md border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50";

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
      >
        Share on Facebook
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
      >
        Share on X
      </a>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
      >
        WhatsApp
      </a>
    </div>
  );
}
