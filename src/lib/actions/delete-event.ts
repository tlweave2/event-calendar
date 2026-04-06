"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteEvent(
  eventId: string,
  scope: "one" | "following" | "all" = "one"
): Promise<void> {
  const session = await auth();
  if (!session) return;

  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId: session.user.tenantId },
    select: { id: true, seriesId: true, seriesIndex: true },
  });
  if (!event) return;

  if (scope === "one" || !event.seriesId) {
    await prisma.event.delete({ where: { id: eventId } });
  } else if (scope === "following") {
    await prisma.event.deleteMany({
      where: {
        seriesId: event.seriesId,
        seriesIndex: { gte: event.seriesIndex ?? 1 },
        tenantId: session.user.tenantId,
      },
    });

    const remaining = await prisma.event.count({
      where: { seriesId: event.seriesId },
    });
    if (remaining === 0) {
      await prisma.eventSeries.delete({ where: { id: event.seriesId } });
    }
  } else {
    await prisma.eventSeries.delete({ where: { id: event.seriesId } });
  }

  revalidatePath("/admin/events");
  revalidatePath("/admin");
  redirect("/admin/events");
}
