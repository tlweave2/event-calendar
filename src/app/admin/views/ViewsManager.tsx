"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCalendarView,
  updateCalendarView,
  deleteCalendarView,
} from "@/lib/actions/calendar-views";

type View = {
  id: string;
  name: string;
  slug: string;
  categoryIds: string[];
};

type Category = {
  id: string;
  name: string;
  color: string | null;
};

function getActionError(result: unknown, fallback: string) {
  if (result && typeof result === "object") {
    if ("error" in result && typeof result.error === "string") {
      return result.error;
    }
    if (
      "errors" in result &&
      result.errors &&
      typeof result.errors === "object" &&
      "_form" in result.errors &&
      Array.isArray(result.errors._form) &&
      typeof result.errors._form[0] === "string"
    ) {
      return result.errors._form[0];
    }
  }

  return fallback;
}

export default function ViewsManager({
  views: initialViews,
  categories,
  tenantSlug,
  baseUrl,
}: {
  views: View[];
  categories: Category[];
  tenantSlug: string;
  baseUrl: string;
}) {
  const [views, setViews] = useState(initialViews);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setSlug("");
    setSelectedCategories([]);
    setError(null);
    setCreating(false);
    setEditingId(null);
  };

  const startEdit = (view: View) => {
    setEditingId(view.id);
    setName(view.name);
    setSlug(view.slug);
    setSelectedCategories(view.categoryIds);
    setCreating(false);
    setError(null);
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    if (editingId) {
      const result = await updateCalendarView({
        viewId: editingId,
        name,
        slug,
        categoryIds: selectedCategories,
      });
      if (!result.success) {
        setError(getActionError(result, "Failed to update"));
        setSaving(false);
        return;
      }
      setViews((prev) =>
        prev.map((v) =>
          v.id === editingId
            ? { ...v, name, slug, categoryIds: selectedCategories }
            : v
        )
      );
    } else {
      const result = await createCalendarView({
        name,
        slug,
        categoryIds: selectedCategories,
      });
      if (!result.success) {
        setError(getActionError(result, "Failed to create"));
        setSaving(false);
        return;
      }
      setViews((prev) => [
        ...prev,
        { id: result.viewId!, name, slug, categoryIds: selectedCategories },
      ]);
    }

    setSaving(false);
    resetForm();
  };

  const handleDelete = async (viewId: string) => {
    if (!confirm("Delete this view? The embed URL will stop working.")) return;
    const result = await deleteCalendarView(viewId);
    if (result.success) {
      setViews((prev) => prev.filter((v) => v.id !== viewId));
    }
  };

  const copyEmbed = async (viewSlug: string) => {
    const url = `${baseUrl}/embed/${tenantSlug}/view/${viewSlug}`;
    const snippet = `<iframe\n  src="${url}"\n  width="100%"\n  height="700"\n  frameborder="0"\n  style="border:none; border-radius:12px;"\n></iframe>`;
    await navigator.clipboard.writeText(snippet);
    setCopied(viewSlug);
    setTimeout(() => setCopied(null), 2000);
  };

  const isEditing = creating || editingId;

  return (
    <div className="space-y-4">
      {views.map((view) =>
        editingId === view.id ? null : (
          <div key={view.id} className="rounded-lg border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">{view.name}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  Embed URL: /embed/{tenantSlug}/view/{view.slug}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Click &quot;Copy Embed&quot; to get the iframe code for your website.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {view.categoryIds.map((catId) => {
                    const cat = categories.find((c) => c.id === catId);
                    if (!cat) return null;
                    return (
                      <span
                        key={catId}
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: cat.color ? `${cat.color}22` : "#f3f4f6",
                          color: cat.color ?? "#6b7280",
                        }}
                      >
                        {cat.name}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyEmbed(view.slug)}
                >
                  {copied === view.slug ? "Copied!" : "Copy Embed"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(view)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleDelete(view.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )
      )}

      {isEditing && (
        <div className="space-y-4 rounded-lg border-2 border-blue-200 bg-white p-5">
          <h3 className="font-medium text-gray-900">
            {editingId ? "Edit View" : "New View"}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>View Name</Label>
              <p className="text-xs text-gray-400">
                A descriptive name for this filtered calendar, like &quot;Music Events&quot;
                or &quot;Downtown Happenings&quot;.
              </p>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingId) {
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, "")
                    );
                  }
                }}
                placeholder="Music Events"
              />
            </div>
            <div className="space-y-1">
              <Label>URL Slug</Label>
              <p className="text-xs text-gray-400">
                The web address for this view. Letters, numbers, and hyphens only.
                Example: &quot;music-events&quot; creates /embed/{tenantSlug}/view/music-events
              </p>
              <div className="flex items-center gap-1">
                <span className="shrink-0 text-xs text-gray-400">/view/</span>
                <Input
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "")
                    )
                  }
                  placeholder="music-events"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Show events from these categories</Label>
            <p className="mb-2 text-xs text-gray-400">
              Click to select which categories this view includes. Only events in
              selected categories will appear on this embed.
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                      isSelected
                        ? "border-transparent text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: cat.color ?? "#2563eb" }
                        : {}
                    }
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
            {selectedCategories.length === 0 && (
              <p className="text-xs text-red-500">Select at least one category</p>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving || !name || !slug || selectedCategories.length === 0}
            >
              {saving ? "Saving..." : editingId ? "Update View" : "Create View"}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!isEditing && views.length > 0 && (
        <Button
          variant="outline"
          onClick={() => {
            resetForm();
            setCreating(true);
          }}
          className="w-full border-dashed"
        >
          + Create New View
        </Button>
      )}

      {views.length === 0 && !isEditing && (
        <div className="rounded-lg border-2 border-dashed border-gray-200 py-12 text-center">
          <p className="text-lg font-medium text-gray-700">No views yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Your main calendar already shows all events. Create a view when you
            want to embed a filtered calendar that only shows certain categories,
            like &quot;Youth Events&quot; or &quot;Music&quot;.
          </p>
          <button
            onClick={() => {
              resetForm();
              setCreating(true);
            }}
            className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Create Your First View
          </button>
        </div>
      )}
    </div>
  );
}
