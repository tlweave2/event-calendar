/* eslint-disable @next/next/no-img-element */

import { getTenantBySlug } from "@/lib/tenant";
import { notFound } from "next/navigation";
import SubmitEventForm from "./SubmitEventForm";
import { recordPageView } from "@/lib/page-views";

export default async function SubmitPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const tenant = await getTenantBySlug(slug);

  if (!tenant) notFound();

  void recordPageView(tenant.id, "submit");

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

  return (
    <div
      className="min-h-screen px-4 py-10"
      style={{
        backgroundColor: bgStyle,
        fontFamily: font ? `"${font}", system-ui, sans-serif` : undefined,
        color: darkMode ? "#f3f4f6" : undefined,
      }}
    >
      {fontLink && <link rel="stylesheet" href={fontLink} />}

      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          {tenant.logoUrl && (
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="mx-auto mb-4 h-12 object-contain"
            />
          )}
          <h1 className={`text-2xl font-semibold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
            Submit an Event
          </h1>
          <p className={`mt-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
            to {tenant.name}
          </p>
        </div>
        <SubmitEventForm
          tenantSlug={slug}
          categories={tenant.categories}
          primaryColor={tenant.primaryColor}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
}
