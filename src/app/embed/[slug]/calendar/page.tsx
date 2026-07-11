export const dynamic = "force-dynamic";

import { getTenantBySlug } from "@/lib/tenant";
import { getMergedApprovedEvents } from "@/lib/merged-events";
import { recordPageView } from "@/lib/page-views";
import { notFound } from "next/navigation";
import Image from "next/image";
import { addDays } from "date-fns";
import CalendarView from "./CalendarView";
import EmbedAutoResize from "../../_components/EmbedAutoResize";

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

  const events = await getMergedApprovedEvents(tenant);

  const param = (key: string) => {
    const value = sp[key];
    if (Array.isArray(value)) return value[0];
    return value;
  };

  const minimal =
    param("minimal") === "true" ||
    (param("minimal") === undefined && (tenant.embedHideHeader ?? false));
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
  const flyersParam = param("flyers");
  const showFlyerGallery =
    flyersParam === "true"
      ? true
      : flyersParam === "false"
        ? false
        : tenant.embedShowFlyerGallery;
  const showBadge = tenant.plan !== "PRO";
  const bgColor = param("bg") ?? tenant.embedBgColor ?? undefined;
  const darkMode =
    param("dark") === "true" ||
    (param("dark") === undefined && tenant.embedDarkMode);
  const accent = param("accent") ?? tenant.primaryColor;

  const categoryId = param("category");
  const daysParam = param("days");
  const days = daysParam ? Number.parseInt(daysParam, 10) : undefined;
  const limitParam = param("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  let scopedEvents = events;
  if (categoryId) {
    scopedEvents = scopedEvents.filter((e) => e.category?.id === categoryId);
  }
  if (days !== undefined && Number.isFinite(days) && days > 0) {
    const cutoff = addDays(new Date(), days);
    scopedEvents = scopedEvents.filter((e) => new Date(e.startAt) <= cutoff);
  }
  if (limit !== undefined && Number.isFinite(limit) && limit > 0) {
    scopedEvents = scopedEvents.slice(0, limit);
  }

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
      <EmbedAutoResize />
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
          events={scopedEvents}
          categories={tenant.categories}
          primaryColor={accent}
          tenantSlug={slug}
          defaultView={defaultView}
          hideSearch={hideSearch}
          hideCategories={hideCategories}
          hideSubmit={hideSubmit}
          showBadge={showBadge}
          darkMode={darkMode}
          cardStyle={cardStyle}
          showFlyerGallery={showFlyerGallery}
          emptyStateMessage={tenant.emptyStateMessage}
          initialCategory={categoryId}
        />
      </div>
    </div>
  );
}