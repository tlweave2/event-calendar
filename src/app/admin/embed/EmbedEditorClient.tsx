"use client";

import { useState, useEffect, useCallback } from "react";
import EmbedSettingsForm, { EmbedPreviewSettings } from "./EmbedSettingsForm";
import EmbedPageClient from "./EmbedPageClient";

type Props = {
  tenantId: string;
  slug: string;
  baseUrl: string;
  primaryColor: string | null;
  embedFontFamily: string | null;
  embedDefaultView: string;
  embedCardStyle: string;
  embedShowFlyerGallery: boolean;
  embedHideSearch: boolean;
  embedHideCategories: boolean;
  embedHideSubmit: boolean;
  embedBgColor: string | null;
  embedDarkMode: boolean;
};

function buildPreviewUrl(slug: string, baseUrl: string, s: EmbedPreviewSettings): string {
  const params = new URLSearchParams();
  if (s.fontFamily && s.fontFamily !== "system-ui") params.set("font", s.fontFamily);
  if (s.defaultView) params.set("view", s.defaultView);
  if (s.cardStyle && s.cardStyle !== "modern") params.set("style", s.cardStyle);
  if (s.bgColor) params.set("bg", s.bgColor);
  if (s.darkMode) params.set("dark", "true");
  if (s.hideSearch) params.set("hideSearch", "true");
  if (s.hideCategories) params.set("hideCategories", "true");
  if (s.hideSubmit) params.set("hideSubmit", "true");
  if (s.showFlyerGallery) params.set("flyers", "true");
  const qs = params.toString();
  return `${baseUrl}/embed/${slug}/calendar${qs ? `?${qs}` : ""}`;
}

export default function EmbedEditorClient({
  tenantId, slug, baseUrl, primaryColor,
  embedFontFamily, embedDefaultView, embedCardStyle,
  embedShowFlyerGallery, embedHideSearch, embedHideCategories, embedHideSubmit,
  embedBgColor, embedDarkMode,
}: Props) {
  const initialSettings: EmbedPreviewSettings = {
    fontFamily: embedFontFamily ?? "system-ui",
    defaultView: embedDefaultView,
    cardStyle: embedCardStyle,
    showFlyerGallery: embedShowFlyerGallery,
    hideSearch: embedHideSearch,
    hideCategories: embedHideCategories,
    hideSubmit: embedHideSubmit,
    bgColor: embedBgColor ?? "",
    darkMode: embedDarkMode,
  };

  const [liveSettings, setLiveSettings] = useState<EmbedPreviewSettings>(initialSettings);
  const [debouncedSettings, setDebouncedSettings] = useState<EmbedPreviewSettings>(initialSettings);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSettings(liveSettings), 400);
    return () => clearTimeout(t);
  }, [liveSettings]);

  const handlePreviewChange = useCallback((s: EmbedPreviewSettings) => {
    setLiveSettings(s);
  }, []);

  const previewUrl = buildPreviewUrl(slug, baseUrl, debouncedSettings);

  return (
    <div className="flex gap-8 items-start">
      {/* ── left column: settings + code generator ── */}
      <div className="min-w-0 w-full lg:w-[480px] lg:shrink-0 space-y-8">
        <EmbedSettingsForm
          tenantId={tenantId}
          primaryColor={primaryColor}
          embedFontFamily={embedFontFamily}
          embedDefaultView={embedDefaultView}
          embedCardStyle={embedCardStyle}
          embedShowFlyerGallery={embedShowFlyerGallery}
          embedHideSearch={embedHideSearch}
          embedHideCategories={embedHideCategories}
          embedHideSubmit={embedHideSubmit}
          embedBgColor={embedBgColor}
          embedDarkMode={embedDarkMode}
          onPreviewChange={handlePreviewChange}
        />

        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-1">Embed Code</h2>
          <p className="text-sm text-gray-500 mb-4">
            Copy and paste these snippets anywhere on your website.
          </p>
          <EmbedPageClient slug={slug} baseUrl={baseUrl} />
        </div>
      </div>

      {/* ── right column: sticky live preview ── */}
      <div className="hidden lg:block flex-1 min-w-0">
        <div className="sticky top-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Live Preview</p>
            <span className="text-xs text-gray-400">Updates as you change settings</span>
          </div>
          <div className="overflow-hidden rounded-xl border shadow-sm bg-gray-50">
            <iframe
              key={previewUrl}
              src={previewUrl}
              width="100%"
              height={700}
              frameBorder="0"
              title="Embed preview"
              className="block"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
