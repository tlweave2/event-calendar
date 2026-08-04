"use server";

import { authorize } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDemoTenant } from "@/lib/demo-guard";
import { deliverWebhook } from "@/lib/webhook";

export async function deleteEvent(
  eventId: string,
  scope: "one" | "following" | "all" = "one"
): Promise<void> {
  const authorized = await authorize("events:delete");
  if (!authorized.ok) return;
  const ctx = authorized.ctx;

  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: { id: true, slug: true },
  });
  if (tenant && isDemoTenant(tenant.id, tenant.slug)) return;

  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId: ctx.tenantId },
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
        tenantId: ctx.tenantId,
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

  // Fire webhook for event.deleted — non-blocking
  deliverWebhook(ctx.tenantId, {
    type: "event.deleted",
    payload: { eventId, scope },
  }).catch((err) => console.error("[webhook] event.deleted failed:", err));

  revalidatePath("/admin/events");
  revalidatePath("/admin");
  redirect("/admin/events");
}
