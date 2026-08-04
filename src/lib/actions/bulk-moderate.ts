"use server";

import { authorize } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendModerationNotice } from "@/lib/email";
import { DEMO_LOCK_MESSAGE, isDemoTenant } from "@/lib/demo-guard";
import { deliverWebhook } from "@/lib/webhook";

type EventWithTenant = {
  id: string;
  title: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submitterEmail: string | null;
  submitterName: string | null;
  tenant: { name: string; slug: string };
};

const bulkModerateSchema = z.object({
  eventIds: z.array(z.string().uuid()).min(1),
  action: z.enum(["APPROVED", "REJECTED", "PENDING"]),
});

export async function bulkModerateEvents(input: {
  eventIds: string[];
  action: "APPROVED" | "REJECTED" | "PENDING";
}) {
  const authorized = await authorize("events:moderate");
  if (!authorized.ok) return { success: false, error: authorized.error };
  const ctx = authorized.ctx;

  const parsed = bulkModerateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { eventIds, action } = parsed.data;
  const tenantId = ctx.tenantId;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true },
  });
  if (tenant && isDemoTenant(tenant.id, tenant.slug)) {
    return { success: false, error: DEMO_LOCK_MESSAGE };
  }

  const events: EventWithTenant[] = await prisma.event.findMany({
    where: { id: { in: eventIds }, tenantId },
    include: { tenant: true },
  });

  if (events.length === 0) return { success: false, error: "No matching events found" };

  await prisma.$transaction([
    ...events.map((event: EventWithTenant) =>
      prisma.event.update({ where: { id: event.id }, data: { status: action } })
    ),
    ...events.map((event: EventWithTenant) =>
      prisma.auditLog.create({
        data: { tenantId, userId: ctx.userId, eventId: event.id, action: `event.${action.toLowerCase()}` },
      })
    ),
  ]);

  // Fire webhook for each approved event — non-blocking
  if (action === "APPROVED") {
    const approvedEvents = await prisma.event.findMany({
      where: { id: { in: eventIds }, tenantId },
      select: { id: true, title: true, startAt: true, endAt: true, submitterEmail: true },
    });
    approvedEvents.forEach((evt) => {
      deliverWebhook(tenantId, {
        type: "event.approved",
        payload: {
          eventId: evt.id,
          title: evt.title,
          startAt: evt.startAt.toISOString(),
          endAt: evt.endAt?.toISOString() ?? null,
          submitterEmail: evt.submitterEmail,
        },
      }).catch((err) => console.error("[webhook] bulk event.approved failed:", err));
    });
  }

  if (action !== "PENDING") {
    await Promise.all(
      events
        .filter((event: EventWithTenant) => event.submitterEmail)
        .map((event: EventWithTenant) =>
          sendModerationNotice({
            to: event.submitterEmail!,
            submitterName: event.submitterName ?? "there",
            eventTitle: event.title,
            tenantName: event.tenant.name,
            action: action === "APPROVED" ? "approved" : "rejected",
            calendarUrl: `${process.env.NEXTAUTH_URL}/embed/${event.tenant.slug}/calendar`,
          }).catch((err) => console.error("[email] bulk moderation notice failed:", err))
        )
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/events");
  return { success: true, updatedCount: events.length };
}