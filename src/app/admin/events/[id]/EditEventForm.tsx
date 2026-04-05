"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateEvent } from "@/lib/actions/update-event";
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
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
    const result = await updateEvent({
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

      <div className="space-y-1">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input id="imageUrl" {...register("imageUrl")} placeholder="https://..." />
      </div>

      {serverError && <p className="text-sm text-red-500">{serverError}</p>}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
        {saved && <p className="text-sm text-green-600">✓ Saved</p>}
      </div>
    </form>
  );
}
