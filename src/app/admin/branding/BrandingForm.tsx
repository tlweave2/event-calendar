"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTenantBranding, updateTenantCustomText } from "@/lib/actions/update-tenant";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export default function BrandingForm({ tenant }: {
  tenant: {
    id: string; slug: string; name: string;
    primaryColor: string | null; secondaryColor: string | null;
    timezone: string; logoUrl: string | null;
    submitHeading: string | null; submitSubheading: string | null; emptyStateMessage: string | null;
  };
}) {
  const [name, setName] = useState(tenant.name);
  const [slug, setSlug] = useState(tenant.slug);
  const [primaryColor, setPrimaryColor] = useState(tenant.primaryColor ?? "#2563eb");
  const [secondaryColor, setSecondaryColor] = useState(tenant.secondaryColor ?? "#dbeafe");
  const [timezone, setTimezone] = useState(tenant.timezone);
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl ?? "");
  const [submitHeading, setSubmitHeading] = useState(tenant.submitHeading ?? "");
  const [submitSubheading, setSubmitSubheading] = useState(tenant.submitSubheading ?? "");
  const [emptyStateMessage, setEmptyStateMessage] = useState(tenant.emptyStateMessage ?? "");
  const [logoUploading, setLogoUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const { uploadUrl, publicUrl } = await res.json();
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setLogoUrl(publicUrl);
    } catch {
      setError("Logo upload failed.");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const result = await updateTenantBranding({
      tenantId: tenant.id,
      name,
      slug,
      primaryColor,
      secondaryColor,
      timezone,
    });

    if (result.success) {
      await fetch("/api/tenant/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl }),
      });

      const customTextResult = await updateTenantCustomText({
        tenantId: tenant.id,
        submitHeading: submitHeading || undefined,
        submitSubheading: submitSubheading || undefined,
        emptyStateMessage: emptyStateMessage || undefined,
      });

      if (customTextResult.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        // If slug changed, reload so sidebar and URLs update correctly
        if (result.slug !== tenant.slug) {
          window.location.reload();
        }
      } else {
        setError("Failed to save custom text.");
      }
    } else {
      setError("Failed to save. Check that your calendar URL is unique.");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 rounded-lg border bg-white p-6">
      <div className="space-y-2">
        <Label>Logo</Label>
        <p className="text-xs text-gray-400">
          Appears at the top of your calendar and submission form. PNG or SVG
          recommended, at least 200px wide.
        </p>
        {logoUrl && (
          <div className="mb-2">
            <img src={logoUrl} alt="Logo" className="h-12 object-contain" />
          </div>
        )}
        <label className="cursor-pointer">
          <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
            {logoUploading ? "Uploading..." : logoUrl ? "Replace logo" : "Upload logo"}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </label>
        <p className="text-xs text-gray-400">PNG or SVG recommended. Max 2MB.</p>
      </div>

      <div className="space-y-1">
        <Label>Organization Name</Label>
        <p className="text-xs text-gray-400">
          Displayed at the top of your calendar and in email notifications to submitters.
        </p>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="space-y-1">
        <Label>Calendar URL</Label>
        <p className="text-xs text-gray-400">
          This is the web address people use to find your calendar. Keep it short
          and recognizable, like your organization name or city.
        </p>
        <div className="flex items-center gap-1">
          <span className="shrink-0 text-sm text-gray-400">/embed/</span>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            className="max-w-48"
          />
        </div>
        <p className="text-xs text-gray-400">Changing this will break existing embed links.</p>
      </div>

      <div className="flex gap-6">
        <div className="space-y-1">
          <Label>Primary Color</Label>
          <p className="text-xs text-gray-400">
            Used for buttons, the calendar header, date blocks, and accent elements
            throughout your embed.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded border"
            />
            <span className="font-mono text-sm text-gray-500">{primaryColor}</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label>Secondary Color</Label>
          <p className="text-xs text-gray-400">
            Used for subtle backgrounds and highlights. Usually a lighter shade of
            your primary color works well.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded border"
            />
            <span className="font-mono text-sm text-gray-500">{secondaryColor}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Timezone</Label>
        <p className="text-xs text-gray-400">
          All event times are displayed in this timezone. Make sure it matches
          where your events take place.
        </p>
        <Select value={timezone} onValueChange={(value) => setTimezone(value ?? timezone)}>
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>{tz}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1 border-t pt-5">
        <h3 className="text-sm font-medium text-gray-700">Custom Text</h3>
        <p className="text-xs text-gray-400">
          Personalize the wording on your public-facing calendar and submission form.
          Leave blank to use the defaults.
        </p>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Submit Form Heading</Label>
            <p className="text-xs text-gray-400">
              The main title visitors see when they open your submission form.
              Default: "Submit an Event"
            </p>
            <Input
              value={submitHeading}
              onChange={(e) => setSubmitHeading(e.target.value)}
              placeholder="Submit an Event"
              maxLength={255}
            />
          </div>

          <div className="space-y-1">
            <Label>Submit Form Subheading</Label>
            <p className="text-xs text-gray-400">
              A short line below the heading, usually your organization name.
              Default: "to [your organization name]"
            </p>
            <Input
              value={submitSubheading}
              onChange={(e) => setSubmitSubheading(e.target.value)}
              placeholder="to [Organization Name]"
              maxLength={255}
            />
          </div>

          <div className="space-y-1">
            <Label>Empty Calendar Message</Label>
            <p className="text-xs text-gray-400">
              What visitors see when there are no upcoming events. Use this to set
              expectations, for example "Check back soon for upcoming downtown events!"
              Default: "No upcoming events"
            </p>
            <Input
              value={emptyStateMessage}
              onChange={(e) => setEmptyStateMessage(e.target.value)}
              placeholder="No upcoming events"
              maxLength={255}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving || logoUploading}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
        {saved && <p className="text-sm text-green-600">✓ Saved</p>}
      </div>
    </div>
  );
}
