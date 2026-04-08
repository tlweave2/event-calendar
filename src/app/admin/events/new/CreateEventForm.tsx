"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createEventFromImport } from "@/lib/actions/create-event-from-import";
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
  startAt: z.string().min(1, "Start date is required"),
  endAt: z.string().optional(),
  locationName: z.string().optional(),
  address: z.string().optional(),
  categoryId: z.string().optional(),
  cost: z.string().optional(),
  ticketUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;
type Category = { id: string; name: string };

export default function CreateEventForm({
  tenantId,
  categories,
}: {
  tenantId: string;
  categories: Category[];
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [preview, setPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      if (!res.ok) throw new Error("Upload failed");

      const { uploadUrl, publicUrl } = await res.json();
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      setImageUrl(publicUrl);
      setPreview(URL.createObjectURL(file));
    } catch {
      setServerError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);

    try {
      await createEventFromImport({
        tenantId,
        title: values.title,
        description: values.description,
        startAt: new Date(values.startAt).toISOString(),
        endAt: values.endAt ? new Date(values.endAt).toISOString() : undefined,
        locationName: values.locationName,
        address: values.address,
        categoryId: values.categoryId || undefined,
        cost: values.cost,
        ticketUrl: values.ticketUrl || undefined,
        imageUrl,
      });

      router.push("/admin/events");
      router.refresh();
    } catch {
      setServerError("Failed to create event. Please try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-lg border bg-white p-6"
    >
      {serverError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {serverError}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="title">Event Title *</Label>
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
          <Label htmlFor="startAt">Start Date & Time *</Label>
          <Input id="startAt" type="datetime-local" {...register("startAt")} />
          {errors.startAt && (
            <p className="text-xs text-red-500">{errors.startAt.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="endAt">End Date & Time</Label>
          <Input id="endAt" type="datetime-local" {...register("endAt")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="locationName">Venue / Location</Label>
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
          <Input
            id="cost"
            {...register("cost")}
            placeholder="Free, $10, Varies..."
          />
        </div>
        <div className="space-y-1">
          <Label>Category</Label>
          <Select
            onValueChange={(v: string | null) =>
              setValue("categoryId", v && v !== "__none" ? v : undefined)
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
        <Input
          id="ticketUrl"
          {...register("ticketUrl")}
          placeholder="https://..."
        />
        {errors.ticketUrl && (
          <p className="text-xs text-red-500">{errors.ticketUrl.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Event Image (optional)</Label>

        {preview && (
          <div className="relative inline-block">
            <Image
              src={preview}
              alt="Preview"
              width={128}
              height={128}
              className="h-32 w-32 rounded-md border object-cover"
            />
            <button
              type="button"
              className="absolute -right-2 -top-2 rounded-full border border-gray-200 bg-white p-0.5 text-gray-400 shadow-sm hover:text-red-500"
              onClick={() => {
                setPreview(null);
                setImageUrl(undefined);
              }}
            >
              ×
            </button>
          </div>
        )}

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
            onChange={handleImageUpload}
          />
        </label>
      </div>

      <div className="flex gap-3 border-t pt-4">
        <Button type="submit" disabled={isSubmitting || uploading}>
          {isSubmitting ? "Creating..." : "Create Event"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
