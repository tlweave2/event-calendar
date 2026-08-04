"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorize } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { DEMO_LOCK_MESSAGE, isDemoTenant } from "@/lib/demo-guard";
import { deliverWebhook } from "@/lib/webhook";

const schema = z.object({
  eventId: z.string().uuid(),
  scope: z.enum(["one", "following"]),
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  startAt: z.string().min(1),
  endAt: z.string().optional(),
  locationName: z.string().optional(),
  address: z.string().optional(),
  categoryId: z.string().optional(),
  cost: z.string().optional(),
  ticketUrl: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().optional(),
});

export async function updateEventSeries(input: z.infer<typeof schema>) {
  const authorized = await authorize("events:write");
  if (!authorized.ok) return { success: false, error: authorized.error };
  const ctx = authorized.ctx;

  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: { id: true, slug: true },
  });
  if (tenant && isDemoTenant(tenant.id, tenant.slug)) {
    return { success: false, error: DEMO_LOCK_MESSAGE };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { eventId, scope, ...data } = parsed.data;

  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId: ctx.tenantId },
  });
  if (!event) return { success: false, error: "Event not found" };

  const sharedData = {
    title: data.title,
    description: data.description ?? null,
    locationName: data.locationName ?? null,
    address: data.address ?? null,
    categoryId: data.categoryId || null,
    cost: data.cost ?? null,
    ticketUrl: data.ticketUrl || null,
    imageUrl: data.imageUrl ?? null,
  };

  const thisInstanceData = {
    ...sharedData,
    startAt: new Date(data.startAt),
    endAt: data.endAt ? new Date(data.endAt) : null,
  };

  if (scope === "one" || !event.seriesId || event.seriesIndex === null) {
    await prisma.event.update({
      where: { id: eventId },
      data: thisInstanceData,
    });
  } else {
    await prisma.$transaction([
      prisma.event.update({
        where: { id: eventId },
        data: thisInstanceData,
      }),
      prisma.event.updateMany({
        where: {
          seriesId: event.seriesId,
          seriesIndex: { gt: event.seriesIndex },
          tenantId: ctx.tenantId,
        },
        data: sharedData,
      }),
    ]);
  }

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      eventId,
      action: "event.edited",
      metadata: { scope, seriesId: event.seriesId },
    },
  });

  // Fire webhook for event.updated (series) — non-blocking
  deliverWebhook(ctx.tenantId, {
    type: "event.updated",
    payload: {
      eventId,
      title: data.title,
      startAt: new Date(data.startAt).toISOString(),
      endAt: data.endAt ? new Date(data.endAt).toISOString() : null,
      scope,
    },
  }).catch((err) => console.error("[webhook] event.updated (series) failed:", err));
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);

  return { success: true };
}
