"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// ── tiny copy button ─────────────────────────────────────────────────────────

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="shrink-0 rounded border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

// ── option pill group ─────────────────────────────────────────────────────────

function Pills<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { label: string; value: T }[];
}) {
  return (
    <div className="flex overflow-hidden rounded-md border border-gray-200 text-sm">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 px-3 py-1.5 font-medium transition-colors ${
            value === opt.value
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          } border-r border-gray-200 last:border-r-0`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── toggle row ────────────────────────────────────────────────────────────────

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

type WidgetType = "calendar" | "events" | "flyers" | "submit";
type CalView = "list" | "grid";
type CardStyle = "modern" | "compact" | "image" | "minimal";
type BgMode = "default" | "transparent" | "dark" | "custom";

export default function EmbedPageClient({
  slug,
  baseUrl,
}: {
  slug: string;
  baseUrl: string;
}) {
  // ── widget type ──────────────────────────────────────────────────────────
  const [widget, setWidget] = useState<WidgetType>("calendar");

  // ── calendar options ─────────────────────────────────────────────────────
  const [calView, setCalView] = useState<CalView>("grid");
  const [cardStyle, setCardStyle] = useState<CardStyle>("modern");
  const [showFlyers, setShowFlyers] = useState(false);
  const [hideHeader, setHideHeader] = useState(false);
  const [hideSearch, setHideSearch] = useState(false);
  const [hideCategories, setHideCategories] = useState(false);
  const [hideSubmit, setHideSubmit] = useState(false);

  // ── shared appearance ────────────────────────────────────────────────────
  const [bgMode, setBgMode] = useState<BgMode>("default");
  const [customBg, setCustomBg] = useState("#ffffff");
  const [darkMode, setDarkMode] = useState(false);
  const [font, setFont] = useState("");

  // ── derived iframe URL ────────────────────────────────────────────────────
  const iframeUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (widget === "calendar") {
      if (calView !== "grid") params.set("view", calView);
      if (cardStyle !== "modern") params.set("style", cardStyle);
      if (showFlyers) params.set("flyers", "true");
      if (hideHeader) params.set("minimal", "true");
      if (hideSearch) params.set("hideSearch", "true");
      if (hideCategories) params.set("hideCategories", "true");
      if (hideSubmit) params.set("hideSubmit", "true");
    }

    if (bgMode === "transparent") params.set("bg", "transparent");
    else if (bgMode === "dark") { params.set("bg", "#111827"); params.set("dark", "true"); }
    else if (bgMode === "custom") params.set("bg", customBg);
    if (darkMode && bgMode !== "dark") params.set("dark", "true");
    if (font.trim()) params.set("font", font.trim());

    const path =
      widget === "events"
        ? `/embed/${slug}/events`
        : widget === "flyers"
          ? `/embed/${slug}/flyers`
          : widget === "submit"
            ? `/embed/${slug}/submit`
            : `/embed/${slug}/calendar`;

    const qs = params.toString();
    return `${baseUrl}${path}${qs ? `?${qs}` : ""}`;
  }, [widget, calView, cardStyle, hideHeader, hideSearch, hideCategories, hideSubmit, bgMode, customBg, darkMode, font, slug, baseUrl]);

  const iframeHeight = widget === "submit" ? 900 : widget === "flyers" ? 500 : 700;

  const snippet = `<iframe\n  src="${iframeUrl}"\n  width="100%"\n  height="${iframeHeight}"\n  frameborder="0"\n  style="border:none; border-radius:12px;"\n></iframe>`;

  return (
    <div className="space-y-8">
      {/* ── widget picker ─────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">What do you want to embed?</Label>
        <Pills
          value={widget}
          onChange={setWidget}
          options={[
            { label: "Full Calendar", value: "calendar" },
            { label: "Events List", value: "events" },
            { label: "Flyer Gallery", value: "flyers" },
            { label: "Submit Form", value: "submit" },
          ]}
        />
        <p className="text-xs text-gray-400">
          {widget === "calendar" && "Your full calendar with search, category filter, and list/grid toggle. Can include a flyer gallery."}
          {widget === "events" && "A clean date-grouped list of upcoming events with no controls. Great for sidebars."}
          {widget === "flyers" && "A photo grid of event flyers for events that have images uploaded."}
          {widget === "submit" && "The form visitors use to propose events for your review."}
        </p>
      </div>

      {/* ── calendar-specific options ─────────────────────────────────── */}
      {widget === "calendar" && (
        <div className="space-y-5 rounded-lg border bg-gray-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Calendar options</p>

          <div className="space-y-1">
            <Label>Default view</Label>
            <Pills
              value={calView}
              onChange={setCalView}
              options={[
                { label: "List", value: "list" },
                { label: "Month grid", value: "grid" },
              ]}
            />
          </div>

          <div className="space-y-1">
            <Label>Card style</Label>
            <Pills
              value={cardStyle}
              onChange={setCardStyle}
              options={[
                { label: "Modern", value: "modern" },
                { label: "Compact", value: "compact" },
                { label: "Image", value: "image" },
                { label: "Minimal", value: "minimal" },
              ]}
            />
          </div>

          <div className="space-y-3">
            <ToggleRow
              id="show-flyers"
              label="Include flyer gallery"
              description="Shows a scrollable strip of event flyers below the calendar."
              checked={showFlyers}
              onChange={setShowFlyers}
            />
            <ToggleRow
              id="hide-header"
              label="Hide header & logo"
              description="Good for tight layouts where you don't need the title."
              checked={hideHeader}
              onChange={setHideHeader}
            />
            <ToggleRow
              id="hide-search"
              label="Hide search bar"
              checked={hideSearch}
              onChange={setHideSearch}
            />
            <ToggleRow
              id="hide-categories"
              label="Hide category filter"
              checked={hideCategories}
              onChange={setHideCategories}
            />
            <ToggleRow
              id="hide-submit"
              label="Hide submit link"
              description="Remove the 'Submit an Event' link from the calendar."
              checked={hideSubmit}
              onChange={setHideSubmit}
            />
          </div>
        </div>
      )}

      {/* ── appearance ────────────────────────────────────────────────── */}
      <div className="space-y-5 rounded-lg border bg-gray-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Appearance</p>

        <div className="space-y-1">
          <Label>Background</Label>
          <Pills
            value={bgMode}
            onChange={setBgMode}
            options={[
              { label: "Default", value: "default" },
              { label: "Transparent", value: "transparent" },
              { label: "Dark", value: "dark" },
              { label: "Custom", value: "custom" },
            ]}
          />
          {bgMode === "custom" && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={customBg}
                onChange={(e) => setCustomBg(e.target.value)}
                className="h-9 w-9 cursor-pointer rounded border"
              />
              <span className="font-mono text-sm text-gray-500">{customBg}</span>
            </div>
          )}
        </div>

        {bgMode !== "dark" && (
          <ToggleRow
            id="dark-mode"
            label="Dark mode"
            description="Inverts text and card colors for dark-themed sites."
            checked={darkMode}
            onChange={setDarkMode}
          />
        )}

        <div className="space-y-1">
          <Label htmlFor="font-input">Font</Label>
          <p className="text-xs text-gray-400">
            Any Google Font name, e.g. <span className="font-mono">Roboto Slab</span> or{" "}
            <span className="font-mono">Poppins</span>. Leave blank to inherit the site font.
          </p>
          <Input
            id="font-input"
            placeholder="e.g. Poppins"
            value={font}
            onChange={(e) => setFont(e.target.value)}
            className="max-w-xs bg-white"
          />
        </div>
      </div>

      {/* ── generated code ────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-gray-700">Your embed code</Label>
          <CopyButton text={snippet} label="Copy iframe code" />
        </div>
        <pre className="overflow-x-auto rounded-lg border bg-gray-900 p-4 text-xs text-gray-100 whitespace-pre-wrap break-all">
          {snippet}
        </pre>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Hosted URL:</span>
          <code className="flex-1 truncate rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
            {iframeUrl}
          </code>
          <CopyButton text={iframeUrl} label="Copy URL" />
        </div>
      </div>

      {/* ── live preview ──────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">Live preview</Label>
        <p className="text-xs text-gray-400">
          This is exactly what visitors will see. Changes above update the preview instantly.
        </p>
        <div className="overflow-hidden rounded-xl border shadow-sm">
          <iframe
            key={iframeUrl}
            src={iframeUrl}
            width="100%"
            height={iframeHeight}
            frameBorder="0"
            title="Embed preview"
          />
        </div>
      </div>

      {/* ── WordPress tip ─────────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
        <p className="font-medium">Using WordPress?</p>
        <p className="mt-1 text-blue-600">
          Add an HTML block to any page or post and paste the iframe code above. Works with
          Elementor, Divi, Gutenberg, and plain HTML sites.
        </p>
      </div>
    </div>
  );
}
