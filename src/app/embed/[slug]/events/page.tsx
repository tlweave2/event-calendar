import { getTenantBySlug } from "@/lib/tenant";
import { getMergedApprovedEvents } from "@/lib/merged-events";
import { recordPageView } from "@/lib/page-views";
import { notFound } from "next/navigation";
import EventsList from "./EventsList";

export default async function EventsOnlyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  void recordPageView(tenant.id, "events");

  const events = await getMergedApprovedEvents(tenant);

  const param = (key: string) => {
    const value = sp[key];
    if (Array.isArray(value)) return value[0];
    return value;
  };

  const font = param("font") ?? tenant.embedFontFamily ?? undefined;
  const bgColor = param("bg") ?? tenant.embedBgColor ?? undefined;
  const darkMode =
    param("dark") === "true" || (param("dark") === undefined && tenant.embedDarkMode);

  const fontLink =
    font && font !== "system-ui"
      ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600;700&display=swap`
      : null;

  const bgStyle =
    bgColor === "transparent"
      ? "transparent"
      : bgColor ?? (darkMode ? "#111827" : "#f9fafb");

  return (
    <div
      className="min-h-screen px-4 py-6"
      style={{
        backgroundColor: bgStyle,
        fontFamily:
          font === "system-ui"
            ? "system-ui, sans-serif"
            : font
              ? `"${font}", system-ui, sans-serif`
              : undefined,
        color: darkMode ? "#f3f4f6" : undefined,
      }}
    >
      {fontLink && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={fontLink} />
      )}
      <div className="mx-auto max-w-2xl">
        <EventsList
          events={events}
          primaryColor={tenant.primaryColor}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
}
