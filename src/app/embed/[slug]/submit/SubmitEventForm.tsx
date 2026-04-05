"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { submitEvent } from "@/lib/actions/submit-event";
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
import { Card, CardContent } from "@/components/ui/card";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  startAt: z.string().min(1, "Start date is required"),
  endAt: z.string().optional(),
  locationName: z.string().optional(),
  address: z.string().optional(),
  categoryId: z.string().optional(),
  submitterName: z.string().min(1, "Your name is required"),
  submitterEmail: z.string().email("Valid email required"),
  ticketUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  cost: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Category = { id: string; name: string };

export default function SubmitEventForm({
  tenantSlug,
  categories,
  primaryColor,
}: {
  tenantSlug: string;
  categories: Category[];
  primaryColor: string | null;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedFields, setExtractedFields] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setServerError("Image must be 5MB or smaller.");
      return;
    }

    setServerError(null);
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    setExtracting(true);
    setExtractedFields([]);

    await Promise.allSettled([
      (async () => {
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: file.name, contentType: file.type }),
          });

          if (!res.ok) {
            throw new Error("Failed to get upload URL");
          }

          const { uploadUrl, publicUrl } = (await res.json()) as {
            uploadUrl: string;
            publicUrl: string;
          };

          const uploadResult = await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });

          if (!uploadResult.ok) {
            throw new Error("Upload failed");
          }

          setImageUrl(publicUrl);
        } catch {
          setServerError("Image upload failed. Please try again.");
          setImageUrl(undefined);
        } finally {
          setUploading(false);
        }
      })(),

      (async () => {
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(",")[1] ?? "");
            };
            reader.onerror = () => reject(new Error("Failed to read image"));
            reader.readAsDataURL(file);
          });

          if (!base64) return;

          const res = await fetch("/api/extract-flyer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64, mediaType: file.type }),
          });

          if (!res.ok) return;

          const data = (await res.json()) as Record<string, string | undefined>;
          const filled: string[] = [];

          if (data.title) {
            setValue("title", data.title);
            filled.push("title");
          }
          if (data.description) {
            setValue("description", data.description);
            filled.push("description");
          }
          if (data.locationName) {
            setValue("locationName", data.locationName);
            filled.push("location");
          }
          if (data.address) {
            setValue("address", data.address);
            filled.push("address");
          }
          if (data.cost) {
            setValue("cost", data.cost);
            filled.push("cost");
          }
          if (data.startAt) {
            setValue("startAt", data.startAt);
            filled.push("date & time");
          }
          if (data.endAt) {
            setValue("endAt", data.endAt);
            filled.push("end time");
          }
          if (data.ticketUrl) {
            setValue("ticketUrl", data.ticketUrl);
            filled.push("ticket URL");
          }

          setExtractedFields(filled);
        } catch {
          // Silent failure: users can still fill form manually.
        } finally {
          setExtracting(false);
        }
      })(),
    ]);
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const result = await submitEvent({
      tenantSlug,
      title: values.title,
      description: values.description,
      startAt: new Date(values.startAt).toISOString(),
      endAt: values.endAt ? new Date(values.endAt).toISOString() : undefined,
      locationName: values.locationName,
      address: values.address,
      categoryId: values.categoryId,
      submitterName: values.submitterName,
      submitterEmail: values.submitterEmail,
      ticketUrl: values.ticketUrl,
      cost: values.cost,
      imageUrl,
    });

    if (result.success) {
      setSubmitted(true);
    } else {
      const formError = result.errors._form?.[0];
      setServerError(formError ?? "Something went wrong. Please try again.");
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mb-4 text-4xl">✓</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Event Submitted!
          </h2>
          <p className="text-sm text-gray-500">
            Your event is under review. You&apos;ll receive an email once it&apos;s approved.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-1">
            <Label htmlFor="title">Event Title *</Label>
            <Input id="title" {...register("title")} />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Event Flyer / Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
              className="cursor-pointer"
            />
            {uploading && (
              <p className="text-xs text-gray-500">Uploading image...</p>
            )}

            {extracting && !uploading && (
              <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                <p className="text-xs text-blue-600">Reading flyer with AI...</p>
              </div>
            )}

            {extractedFields.length > 0 && !extracting && (
              <div className="rounded-md bg-green-50 px-3 py-2">
                <p className="text-xs text-green-700">
                  {`✓ Auto-filled from flyer: ${extractedFields.join(", ")}. Please review and correct if needed.`}
                </p>
              </div>
            )}

            {imagePreview && (
              <>
                <div
                  className="mt-2 inline-block cursor-zoom-in overflow-hidden rounded-md border"
                  onClick={() => setLightboxOpen(true)}
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-24 w-24 object-cover transition-transform hover:scale-105"
                  />
                  <p className="bg-gray-50 py-1 text-center text-xs text-gray-400">
                    Click to enlarge
                  </p>
                </div>
                {lightboxOpen && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setLightboxOpen(false)}
                  >
                    <button
                      className="absolute right-4 top-4 text-3xl text-white opacity-80 hover:opacity-100"
                      onClick={() => setLightboxOpen(false)}
                    >
                      ×
                    </button>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </>
            )}
            <p className="text-xs text-gray-400">
              JPG, PNG, WebP, GIF up to 5MB - AI will auto-fill event details
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Tell people what your event is about..."
              {...register("description")}
            />
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

          <div className="space-y-1">
            <Label htmlFor="locationName">Venue / Location Name</Label>
            <Input id="locationName" {...register("locationName")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} />
          </div>

          {categories.length > 0 && (
            <div className="space-y-1">
              <Label>Category</Label>
              <Select
                onValueChange={(val) =>
                  setValue("categoryId", typeof val === "string" ? val : undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="cost">Cost</Label>
              <Input id="cost" placeholder="Free, $10, Varies..." {...register("cost")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ticketUrl">Ticket / Registration URL</Label>
              <Input id="ticketUrl" placeholder="https://..." {...register("ticketUrl")} />
              {errors.ticketUrl && (
                <p className="text-xs text-red-500">{errors.ticketUrl.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4 border-t pt-6">
            <p className="text-sm font-medium text-gray-700">Your Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="submitterName">Your Name *</Label>
                <Input id="submitterName" {...register("submitterName")} />
                {errors.submitterName && (
                  <p className="text-xs text-red-500">
                    {errors.submitterName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="submitterEmail">Your Email *</Label>
                <Input id="submitterEmail" type="email" {...register("submitterEmail")} />
                {errors.submitterEmail && (
                  <p className="text-xs text-red-500">
                    {errors.submitterEmail.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {serverError && <p className="text-sm text-red-500">{serverError}</p>}

          <Button
            type="submit"
            disabled={isSubmitting || uploading || extracting}
            className="w-full"
            style={primaryColor ? { backgroundColor: primaryColor } : {}}
          >
            {isSubmitting ? "Submitting..." : "Submit Event"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
