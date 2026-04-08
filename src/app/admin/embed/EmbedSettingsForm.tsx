"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateEmbedSettings } from "@/lib/actions/update-tenant";
import CalendarStylePicker from "./CalendarStylePicker";

const FONT_OPTIONS = [
  { value: "system-ui", label: "System Default" },
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Poppins", label: "Poppins" },
  { value: "Merriweather", label: "Merriweather" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Nunito", label: "Nunito" },
  { value: "Montserrat", label: "Montserrat" },
];

type Props = {
  tenantId: string;
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

export default function EmbedSettingsForm({ tenantId, ...initial }: Props) {
  const [fontFamily, setFontFamily] = useState(initial.embedFontFamily ?? "system-ui");
  const [defaultView, setDefaultView] = useState(initial.embedDefaultView);
  const [cardStyle, setCardStyle] = useState(initial.embedCardStyle ?? "modern");
  const [showFlyerGallery, setShowFlyerGallery] = useState(initial.embedShowFlyerGallery);
  const [hideSearch, setHideSearch] = useState(initial.embedHideSearch);
  const [hideCategories, setHideCategories] = useState(initial.embedHideCategories);
  const [hideSubmit, setHideSubmit] = useState(initial.embedHideSubmit);
  const [bgColor, setBgColor] = useState(initial.embedBgColor ?? "");
  const [darkMode, setDarkMode] = useState(initial.embedDarkMode);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateEmbedSettings({
      tenantId,
      embedFontFamily: fontFamily === "system-ui" ? null : fontFamily,
      embedDefaultView: defaultView as "list" | "grid",
      embedCardStyle: cardStyle as "modern" | "compact" | "image" | "minimal",
      embedShowFlyerGallery: showFlyerGallery,
      embedHideSearch: hideSearch,
      embedHideCategories: hideCategories,
      embedHideSubmit: hideSubmit,
      embedBgColor: bgColor || null,
      embedDarkMode: darkMode,
    });
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="space-y-6 rounded-lg border bg-white p-6">
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-400">
          Embed Appearance
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          These are the defaults for your embedded calendar. They can also be
          overridden per-embed with URL query params.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Font Family</Label>
          <Select value={fontFamily} onValueChange={(value) => setFontFamily(value ?? "system-ui")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Default View</Label>
          <Select value={defaultView} onValueChange={(value) => setDefaultView(value ?? "list")}>
            <SelectTrigger className="h-12 text-base"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="list">List</SelectItem>
              <SelectItem value="grid">Calendar Grid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Background Color</Label>
          <div className="flex items-center gap-2">
            <Input
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              placeholder="#f9fafb or transparent"
              className="flex-1"
            />
            {bgColor && bgColor !== "transparent" && (
              <div
                className="h-9 w-9 shrink-0 rounded border"
                style={{ backgroundColor: bgColor }}
              />
            )}
          </div>
        </div>

        <div className="sm:col-span-2">
          <CalendarStylePicker
            value={cardStyle}
            onChange={setCardStyle}
            accentColor={initial.primaryColor ?? "#2563eb"}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wide text-gray-400">Toggle Elements</Label>
        {[
          { label: "Hide search bar", value: hideSearch, set: setHideSearch },
          { label: "Hide category filter", value: hideCategories, set: setHideCategories },
          { label: 'Hide "Submit an Event" link', value: hideSubmit, set: setHideSubmit },
          { label: "Dark mode", value: darkMode, set: setDarkMode },
          { label: "Show flyer gallery at bottom", value: showFlyerGallery, set: setShowFlyerGallery },
        ].map((item) => (
          <label key={item.label} className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={item.value}
              onChange={(e) => item.set(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">{item.label}</span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t pt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
        {saved && <span className="text-sm text-green-600">Saved!</span>}
      </div>
    </div>
  );
}
