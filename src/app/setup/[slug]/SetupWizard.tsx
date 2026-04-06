"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  updateTenantBranding,
  updateTenantCategories,
} from "@/lib/actions/update-tenant";

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

type Category = {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
};

type Tenant = {
  id: string;
  slug: string;
  name: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  timezone: string;
  categories: Category[];
};

const STEPS = ["Branding", "Categories", "Timezone", "Go Live"];

export default function SetupWizard({
  tenant,
  baseUrl,
}: {
  tenant: Tenant;
  baseUrl: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSlug, setCurrentSlug] = useState(tenant.slug);

  // Branding state.
  const [name, setName] = useState(tenant.name);
  const [slug, setSlug] = useState(tenant.slug);
  const [primaryColor, setPrimaryColor] = useState(tenant.primaryColor ?? "#2563eb");
  const [secondaryColor, setSecondaryColor] = useState(
    tenant.secondaryColor ?? "#dbeafe"
  );

  // Categories state.
  const [categories, setCategories] = useState<
    { name: string; color: string; sortOrder: number }[]
  >(
    tenant.categories.length > 0
      ? tenant.categories.map((c) => ({
          name: c.name,
          color: c.color ?? "#6366f1",
          sortOrder: c.sortOrder,
        }))
      : [{ name: "", color: "#6366f1", sortOrder: 0 }]
  );

  // Timezone state.
  const [timezone, setTimezone] = useState(tenant.timezone);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const saveBranding = async () => {
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
    setSaving(false);
    if (!result.success) {
      setError("Failed to save branding. Check that your calendar URL is unique.");
      return false;
    }
    if (typeof result.slug === "string") {
      setCurrentSlug(result.slug);
    }
    return true;
  };

  const saveCategories = async () => {
    setSaving(true);
    setError(null);
    const valid = categories.filter((c) => c.name.trim().length > 0);
    const result = await updateTenantCategories({
      tenantId: tenant.id,
      categories: valid.map((c, i) => ({ ...c, sortOrder: i })),
    });
    setSaving(false);
    if (!result.success) {
      setError("Failed to save categories.");
      return false;
    }
    return true;
  };

  const saveTimezone = async () => {
    setSaving(true);
    setError(null);
    const result = await updateTenantBranding({
      tenantId: tenant.id,
      name,
      slug: currentSlug,
      primaryColor,
      secondaryColor,
      timezone,
    });
    setSaving(false);
    if (!result.success) {
      setError("Failed to save timezone.");
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    let ok = true;
    if (step === 0) ok = await saveBranding();
    if (step === 1) ok = await saveCategories();
    if (step === 2) ok = await saveTimezone();
    if (ok) next();
  };

  const addCategory = () =>
    setCategories((prev) => [
      ...prev,
      { name: "", color: "#6366f1", sortOrder: prev.length },
    ]);

  const removeCategory = (i: number) =>
    setCategories((prev) => prev.filter((_, idx) => idx !== i));

  const updateCategory = (i: number, field: "name" | "color", value: string) =>
    setCategories((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c))
    );

  const calendarUrl = `${baseUrl}/embed/${currentSlug}/calendar`;
  const submitUrl = `${baseUrl}/embed/${currentSlug}/submit`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold
                ${
                  i < step
                    ? "bg-green-500 text-white"
                    : i === step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
            >
              {i < step ? "OK" : i + 1}
            </div>
            <span
              className={`hidden text-sm sm:block ${
                i === step ? "font-medium text-gray-900" : "text-gray-400"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="mx-1 h-px w-8 bg-gray-200" />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-5 pt-6">
          {step === 0 && (
            <>
              <h2 className="font-semibold text-gray-900">Branding</h2>
              <div className="space-y-1">
                <Label>Organization name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Calendar URL</Label>
                <div className="flex items-center gap-1">
                  <span className="shrink-0 text-sm text-gray-400">{baseUrl}/embed/</span>
                  <Input
                    value={slug}
                    onChange={(e) =>
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                    }
                    className="max-w-48"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="space-y-1">
                  <Label>Primary color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded border"
                    />
                    <span className="font-mono text-sm text-gray-500">{primaryColor}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Secondary color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded border"
                    />
                    <span className="font-mono text-sm text-gray-500">{secondaryColor}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="font-semibold text-gray-900">Event Categories</h2>
              <p className="text-sm text-gray-500">
                Customize the categories submitters can choose from.
              </p>
              <div className="space-y-2">
                {categories.map((cat, i) => (
                  <div key={`${cat.name}-${i}`} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cat.color}
                      onChange={(e) => updateCategory(i, "color", e.target.value)}
                      className="h-8 w-8 shrink-0 cursor-pointer rounded border"
                    />
                    <Input
                      value={cat.name}
                      onChange={(e) => updateCategory(i, "name", e.target.value)}
                      placeholder="Category name"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-gray-400 hover:text-red-500"
                      onClick={() => removeCategory(i)}
                      disabled={categories.length <= 1}
                    >
                      X
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addCategory}>
                + Add category
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-semibold text-gray-900">Timezone</h2>
              <p className="text-sm text-gray-500">
                All event times will display in this timezone.
              </p>
              <Select value={timezone} onValueChange={(value) => setTimezone(value ?? timezone)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-semibold text-gray-900">You are ready to go live</h2>
              <p className="text-sm text-gray-500">
                Add these embed codes to your website, or share the hosted URLs directly.
              </p>

              <EmbedBlock
                label="Public Calendar"
                hostedUrl={calendarUrl}
                iframeSnippet={`<iframe src="${calendarUrl}" width="100%" height="700" frameborder="0"></iframe>`}
              />

              <EmbedBlock
                label="Event Submission Form"
                hostedUrl={submitUrl}
                iframeSnippet={`<iframe src="${submitUrl}" width="100%" height="900" frameborder="0"></iframe>`}
              />

              <Button className="mt-4 w-full" onClick={() => router.push("/admin")}>
                Go to Admin Dashboard {">"}
              </Button>
            </>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          {step < 3 && (
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={back} disabled={step === 0}>
                Back
              </Button>
              <Button onClick={handleNext} disabled={saving}>
                {saving ? "Saving..." : step === 2 ? "Save & Continue" : "Next"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmbedBlock({
  label,
  hostedUrl,
  iframeSnippet,
}: {
  label: string;
  hostedUrl: string;
  iframeSnippet: string;
}) {
  const [copied, setCopied] = useState<"url" | "iframe" | null>(null);

  const copy = async (text: string, type: "url" | "iframe") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded bg-gray-100 px-2 py-1.5 text-xs text-gray-600">
            {hostedUrl}
          </code>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 text-xs"
            onClick={() => copy(hostedUrl, "url")}
          >
            {copied === "url" ? "Copied!" : "Copy URL"}
          </Button>
        </div>
        <div className="flex items-start gap-2">
          <code className="flex-1 break-all rounded bg-gray-100 px-2 py-1.5 text-xs text-gray-600">
            {iframeSnippet}
          </code>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 text-xs"
            onClick={() => copy(iframeSnippet, "iframe")}
          >
            {copied === "iframe" ? "Copied!" : "Copy iframe"}
          </Button>
        </div>
      </div>
    </div>
  );
}