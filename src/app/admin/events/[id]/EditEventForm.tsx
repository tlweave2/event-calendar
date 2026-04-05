"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateEvent } from "@/lib/actions/update-event";
import { updateEventSeries } from "@/lib/actions/update-event-series";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  startAt: z.string().min(1, "Start date required"),
  endAt: z.string().optional(),
  locationName: z.string().optional(),
  address: z.string().optional(),
  categoryId: z.string().optional(),
  cost: z.string().optional(),
  ticketUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  imageUrl: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type Category = { id: string; name: string };

function toDatetimeLocal(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function EditEventForm({
  event,
  categories,
  seriesId,
  seriesIndex,
}: {
  event: {
    id: string;
    title: string;
    description: string | null;
    startAt: Date;
    endAt: Date | null;
    locationName: string | null;
    address: string | null;
    categoryId: string | null;
    cost: string | null;
    ticketUrl: string | null;
    imageUrl: string | null;
  };
  categories: Category[];
  seriesId: string | null;
  seriesIndex: number | null;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(event.imageUrl ?? null);
  const [scope, setScope] = useState<"one" | "following" | null>(seriesId ? null : "one");
  const [showScopeModal, setShowScopeModal] = useState(!!seriesId);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: event.title,
      description: event.description ?? "",
      startAt: toDatetimeLocal(event.startAt),
      endAt: toDatetimeLocal(event.endAt),
      locationName: event.locationName ?? "",
      address: event.address ?? "",
      categoryId: event.categoryId ?? "",
      cost: event.cost ?? "",
      ticketUrl: event.ticketUrl ?? "",
      imageUrl: event.imageUrl ?? "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const result = seriesId
      ? await updateEventSeries({
          eventId: event.id,
          scope: scope ?? "one",
          ...values,
          categoryId: values.categoryId || undefined,
          ticketUrl: values.ticketUrl || undefined,
        })
      : await updateEvent({
          eventId: event.id,
          ...values,
          categoryId: values.categoryId || undefined,
          ticketUrl: values.ticketUrl || undefined,
        });

    if (result.success) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } else {
      setServerError(result.error ?? "Something went wrong.");
    }
  };

  if (showScopeModal) {
    return (
      <div className="space-y-4 rounded-lg border bg-white p-6">
        <h3 className="font-semibold text-gray-900">Edit recurring event</h3>
        <p className="text-sm text-gray-500">
          This event is part of a recurring series{seriesIndex ? ` (occurrence #${seriesIndex})` : ""}.
        </p>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="radio"
              name="scope"
              value="one"
              onChange={() => setScope("one")}
              checked={scope === "one"}
            />
            <span className="text-sm text-gray-700">Just this event</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="radio"
              name="scope"
              value="following"
              onChange={() => setScope("following")}
              checked={scope === "following"}
            />
            <span className="text-sm text-gray-700">This and following events</span>
          </label>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            disabled={!scope}
            onClick={() => setShowScopeModal(false)}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" {...register("title")} />
        {errors.title && (
          <p className="text-xs text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={4} {...register("description")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="startAt">Start *</Label>
          <Input id="startAt" type="datetime-local" {...register("startAt")} />
          {errors.startAt && (
            <p className="text-xs text-red-500">{errors.startAt.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="endAt">End</Label>
          <Input id="endAt" type="datetime-local" {...register("endAt")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="locationName">Venue</Label>
          <Input id="locationName" {...register("locationName")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...register("address")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="cost">Cost</Label>
          <Input id="cost" {...register("cost")} placeholder="Free, $10, Varies..." />
        </div>
        <div className="space-y-1">
          <Label>Category</Label>
          <Select
            defaultValue={event.categoryId ?? "__none"}
            onValueChange={(v) =>
              setValue("categoryId", typeof v === "string" && v !== "__none" ? v : undefined)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">No category</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="ticketUrl">Ticket / Registration URL</Label>
        <Input id="ticketUrl" {...register("ticketUrl")} placeholder="https://..." />
        {errors.ticketUrl && (
          <p className="text-xs text-red-500">{errors.ticketUrl.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Flyer / Image</Label>

        {/* Current image thumbnail */}
        {preview && (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Current flyer"
              className="h-32 w-32 rounded-md border object-cover"
            />
            <button
              type="button"
              className="absolute -right-2 -top-2 rounded-full border border-gray-200 bg-white p-0.5 text-gray-400 shadow-sm hover:text-red-500"
              onClick={() => {
                setPreview(null);
                setValue("imageUrl", "");
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Upload button */}
        <div>
          <label className="cursor-pointer">
            <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
              {uploading ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                  Uploading...
                </>
              ) : preview ? (
                "Replace image"
              ) : (
                "Upload image"
              )}
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                  setServerError("Image must be 5MB or smaller.");
                  return;
                }
                setUploading(true);
                setServerError(null);
                try {
                  const res = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ filename: file.name, contentType: file.type }),
                  });
                  if (!res.ok) throw new Error("upload-url-failed");
                  const { uploadUrl, publicUrl } = await res.json();
                  await fetch(uploadUrl, {
                    method: "PUT",
                    body: file,
                    headers: { "Content-Type": file.type },
                  });
                  setPreview(publicUrl);
                  setValue("imageUrl", publicUrl);
                } catch {
                  setServerError("Image upload failed.");
                } finally {
                  setUploading(false);
                }
              }}
            />
          </label>
          <p className="mt-1 text-xs text-gray-400">JPG, PNG, WebP up to 5MB</p>
        </div>
      </div>

      {serverError && <p className="text-sm text-red-500">{serverError}</p>}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting || uploading}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
        {saved && <p className="text-sm text-green-600">✓ Saved</p>}
      </div>
    </form>
  );
}
