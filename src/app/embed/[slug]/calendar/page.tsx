import { getTenantBySlug } from "@/lib/tenant";
import { getApprovedEvents } from "@/lib/prisma-tenant";
import { recordPageView } from "@/lib/page-views";
import { notFound } from "next/navigation";
import Image from "next/image";
import CalendarView from "./CalendarView";

export default async function CalendarPage({
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

  void recordPageView(tenant.id, "calendar");

  const events = await getApprovedEvents(tenant.id);

  const param = (key: string) => {
    const value = sp[key];
    if (Array.isArray(value)) return value[0];
    return value;
  };

  const minimal = param("minimal") === "true";
  const font = param("font") ?? tenant.embedFontFamily ?? undefined;
  const viewRaw = param("view") ?? tenant.embedDefaultView ?? "grid";
  const defaultView = viewRaw === "grid" ? "grid" : "list";
  const styleParam = param("style");
  const cardStyle =
    styleParam && ["modern", "compact", "image", "minimal"].includes(styleParam)
      ? (styleParam as "modern" | "compact" | "image" | "minimal")
      : ((tenant.embedCardStyle ?? "modern") as "modern" | "compact" | "image" | "minimal");
  const hideSearch =
    param("hideSearch") === "true" ||
    (param("hideSearch") === undefined && tenant.embedHideSearch);
  const hideCategories =
    param("hideCategories") === "true" ||
    (param("hideCategories") === undefined && tenant.embedHideCategories);
  const hideSubmit =
    param("hideSubmit") === "true" ||
    (param("hideSubmit") === undefined && tenant.embedHideSubmit);
  const showBadge = tenant.plan !== "PRO";
  const bgColor = param("bg") ?? tenant.embedBgColor ?? undefined;
  const darkMode =
    param("dark") === "true" ||
    (param("dark") === undefined && tenant.embedDarkMode);

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
      className={`min-h-screen px-4 ${minimal ? "py-4" : "py-10"}`}
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
      <div className="mx-auto max-w-4xl">
        {!minimal && (
          <div className="mb-8 text-center">
            {tenant.logoUrl && (
              <Image
                src={tenant.logoUrl}
                alt={tenant.name}
                width={200}
                height={48}
                className="mx-auto mb-4 object-contain"
              />
            )}
            <h1 className={`text-2xl font-semibold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
              {tenant.name}
            </h1>
            <p className={`mt-1 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Upcoming Events
            </p>
          </div>
        )}

        <CalendarView
          events={events}
          categories={tenant.categories}
          primaryColor={tenant.primaryColor}
          tenantSlug={slug}
          defaultView={defaultView}
          hideSearch={hideSearch}
          hideCategories={hideCategories}
          hideSubmit={hideSubmit}
          showBadge={showBadge}
          darkMode={darkMode}
          cardStyle={cardStyle}
        />
      </div>
    </div>
  );
}