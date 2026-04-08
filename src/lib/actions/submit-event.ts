"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sendAdminNotification, sendSubmissionConfirmation } from "@/lib/email";
import { checkEventLimit } from "@/lib/plan-limits";
import { createEventSeries } from "./create-event-series";
import { demoFormError, isDemoTenant } from "@/lib/demo-guard";

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
  recurrence: z.enum(["weekly", "biweekly", "monthly"]).optional(),
  occurrences: z.number().int().min(1).max(52).optional(),
});

export type SubmitEventInput = z.infer<typeof submitEventSchema>;

type SubmitResult =
  | { success: true; eventId: string }
  | { success: false; errors: Record<string, string[]>; limitReached?: boolean };

export async function submitEvent(input: SubmitEventInput): Promise<SubmitResult> {
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

  if (isDemoTenant(tenant.id, tenant.slug)) {
    return demoFormError();
  }

  const limitCheck = await checkEventLimit(tenant.id);
  if (!limitCheck.allowed) {
    return {
      success: false,
      limitReached: true,
      errors: {
        _form: [
          `This calendar has reached its monthly limit of ${limitCheck.limit} events. Please contact the calendar administrator.`,
        ],
      },
    };
  }

  // Auto-approve when submitter is an admin/owner of this tenant.
  const isAdmin = await prisma.user.findFirst({
    where: {
      tenantId: tenant.id,
      email: data.submitterEmail.toLowerCase(),
      role: { in: ["OWNER", "ADMIN"] },
    },
  });
  const status = isAdmin ? "APPROVED" : "PENDING";

  if (data.recurrence && data.occurrences && data.occurrences > 1) {
    const seriesResult = await createEventSeries({
      tenantId: tenant.id,
      title: data.title,
      description: data.description,
      startAt: new Date(data.startAt),
      endAt: data.endAt ? new Date(data.endAt) : null,
      locationName: data.locationName,
      address: data.address,
      categoryId: data.categoryId || undefined,
      submitterName: data.submitterName,
      submitterEmail: data.submitterEmail,
      ticketUrl: data.ticketUrl || undefined,
      cost: data.cost,
      imageUrl: data.imageUrl,
      rule: data.recurrence,
      occurrences: data.occurrences,
      status,
    });

    if (!seriesResult.success) {
      return { success: false, errors: { _form: ["Failed to create recurring series."] } };
    }

    const firstEvent = await prisma.event.findFirst({
      where: { seriesId: seriesResult.seriesId },
      orderBy: { seriesIndex: "asc" },
      select: { id: true },
    });

    sendSubmissionConfirmation({
      to: data.submitterEmail,
      submitterName: data.submitterName ?? "there",
      eventTitle: `${data.title} (${data.occurrences} occurrences)`,
      eventId: firstEvent?.id ?? seriesResult.seriesId,
      tenantName: tenant.name,
    }).catch((err) =>
      console.error("[email] submission confirmation failed:", err)
    );

    if (!isAdmin) {
      const admins = await prisma.user.findMany({
        where: { tenantId: tenant.id },
        select: { email: true },
      });

      const adminUrl = `${process.env.NEXTAUTH_URL ?? "https://www.useventful.com"}/admin`;

      admins.forEach(({ email }) => {
        sendAdminNotification({
          to: email,
          eventTitle: `${data.title} (recurring ${data.recurrence})`,
          submitterName: data.submitterName,
          tenantName: tenant.name,
          adminUrl,
        }).catch((err) =>
          console.error("[email] admin notification failed:", err)
        );
      });
    }

    revalidatePath(`/embed/${tenantSlug}/calendar`);
    return { success: true, eventId: firstEvent?.id ?? "" };
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
      status,
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

  if (!isAdmin) {
    const admins = await prisma.user.findMany({
      where: { tenantId: tenant.id },
      select: { email: true },
    });

    const adminUrl = `${process.env.NEXTAUTH_URL ?? "https://www.useventful.com"}/admin`;

    admins.forEach(({ email }) => {
      sendAdminNotification({
        to: email,
        eventTitle: data.title,
        submitterName: data.submitterName,
        tenantName: tenant.name,
        adminUrl,
      }).catch((err) =>
        console.error("[email] admin notification failed:", err)
      );
    });
  }

  revalidatePath(`/embed/${tenantSlug}/calendar`);

  return { success: true, eventId: event.id };
}
