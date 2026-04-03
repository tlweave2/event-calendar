"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sendSubmissionConfirmation } from "@/lib/email";

const submitEventSchema = z.object({
  tenantSlug: z.string(),
  title: z.string().min(3).max(255),
  description: z.string().max(5000).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional(),
  locationName: z.string().max(255).optional(),
  address: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  submitterName: z.string().max(255),
  submitterEmail: z.string().email(),
  ticketUrl: z.string().url().optional().or(z.literal("")),
  cost: z.string().max(100).optional(),
  imageUrl: z.string().optional(),
});

export type SubmitEventInput = z.infer<typeof submitEventSchema>;

export async function submitEvent(input: SubmitEventInput) {
  const parsed = submitEventSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { tenantSlug, ...data } = parsed.data;

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });

  if (!tenant) {
    return { success: false, errors: { tenantSlug: ["Tenant not found"] } };
  }

  const event = await prisma.event.create({
    data: {
      tenantId: tenant.id,
      title: data.title,
      description: data.description,
      startAt: new Date(data.startAt),
      endAt: data.endAt ? new Date(data.endAt) : null,
      locationName: data.locationName,
      address: data.address,
      categoryId: data.categoryId || null,
      submitterName: data.submitterName,
      submitterEmail: data.submitterEmail,
      ticketUrl: data.ticketUrl || null,
      cost: data.cost,
      imageUrl: data.imageUrl,
      status: "PENDING",
    },
  });

  // Fire confirmation email - non-blocking
  sendSubmissionConfirmation({
    to: data.submitterEmail,
    submitterName: data.submitterName ?? "there",
    eventTitle: data.title,
    eventId: event.id,
    tenantName: tenant.name,
  }).catch((err) =>
    console.error("[email] submission confirmation failed:", err)
  );

  revalidatePath(`/embed/${tenantSlug}/calendar`);

  return { success: true, eventId: event.id };
}
