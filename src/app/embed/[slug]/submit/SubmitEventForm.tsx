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

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

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
      imageUrl: undefined,
    });

    if (result.success) {
      setSubmitted(true);
    } else {
      setServerError("Something went wrong. Please try again.");
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
            disabled={isSubmitting}
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
