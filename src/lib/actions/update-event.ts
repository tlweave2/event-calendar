"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DEMO_LOCK_MESSAGE, isDemoTenant } from "@/lib/demo-guard";

const updateEventSchema = z.object({
  eventId: z.string().uuid(),
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  startAt: z.string(),
  endAt: z.string().optional(),
  locationName: z.string().optional(),
  address: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  cost: z.string().optional(),
  ticketUrl: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().optional(),
});

export async function updateEvent(input: z.infer<typeof updateEventSchema>) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { id: true, slug: true },
  });
  if (tenant && isDemoTenant(tenant.id, tenant.slug)) {
    return { success: false, error: DEMO_LOCK_MESSAGE };
  }

  const parsed = updateEventSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { eventId, ...data } = parsed.data;

  const existing = await prisma.event.findFirst({
    where: { id: eventId, tenantId: session.user.tenantId },
  });
  if (!existing) return { success: false, error: "Event not found" };

  await prisma.event.update({
    where: { id: eventId },
    data: {
      title: data.title,
      description: data.description,
      startAt: new Date(data.startAt),
      endAt: data.endAt ? new Date(data.endAt) : null,
      locationName: data.locationName,
      address: data.address,
      categoryId: data.categoryId || null,
      cost: data.cost,
      ticketUrl: data.ticketUrl || null,
      imageUrl: data.imageUrl,
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      userId: session.user.id,
      eventId,
      action: "event.edited",
    },
  });

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);

  return { success: true };
}
