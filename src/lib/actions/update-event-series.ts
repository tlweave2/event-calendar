"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { eventId, scope, ...data } = parsed.data;

  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId: session.user.tenantId },
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
          tenantId: session.user.tenantId,
        },
        data: sharedData,
      }),
    ]);
  }

  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      userId: session.user.id,
      eventId,
      action: "event.edited",
      metadata: { scope, seriesId: event.seriesId },
    },
  });

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);

  return { success: true };
}
