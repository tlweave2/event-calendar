"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateTenantCategories } from "@/lib/actions/update-tenant";

type Category = { id?: string; name: string; color: string; sortOrder: number };

export default function CategoriesForm({
  tenantId,
  initialCategories,
}: {
  tenantId: string;
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState<Category[]>(
    initialCategories.length > 0
      ? initialCategories
      : [{ name: "", color: "#6366f1", sortOrder: 0 }]
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = () =>
    setCategories((prev) => [
      ...prev,
      { name: "", color: "#6366f1", sortOrder: prev.length },
    ]);

  const remove = (i: number) =>
    setCategories((prev) => prev.filter((_, idx) => idx !== i));

  const update = (i: number, field: "name" | "color", value: string) =>
    setCategories((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c))
    );

  const handleSave = async () => {
    const valid = categories.filter((c) => c.name.trim().length > 0);
    if (valid.length === 0) {
      setError("Add at least one category.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await updateTenantCategories({
      tenantId,
      categories: valid.map((c, i) => ({ ...c, sortOrder: i })),
    });
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError("Failed to save categories.");
    }
  };

  return (
    <div className="space-y-4 rounded-lg border bg-white p-6">
      <div className="space-y-2">
        {categories.map((cat, i) => (
          <div key={i} className="flex items-center gap-3">
            <input
              type="color"
              value={cat.color}
              onChange={(e) => update(i, "color", e.target.value)}
              className="h-9 w-9 cursor-pointer rounded border shrink-0"
            />
            <Input
              value={cat.name}
              onChange={(e) => update(i, "name", e.target.value)}
              placeholder="Category name"
              className="flex-1"
            />
            <button
              onClick={() => remove(i)}
              className="px-1 text-lg font-medium text-gray-300 hover:text-red-400"
              disabled={categories.length === 1}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={add}>
        + Add category
      </Button>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3 border-t pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save categories"}
        </Button>
        {saved && <p className="text-sm text-green-600">✓ Saved</p>}
      </div>
    </div>
  );
}
