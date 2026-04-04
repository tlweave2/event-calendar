"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendModerationNotice } from "@/lib/email";
import { Prisma } from "@prisma/client";

type EventWithTenant = Prisma.EventGetPayload<{ include: { tenant: true } }>;

const bulkModerateSchema = z.object({
  eventIds: z.array(z.string().uuid()).min(1),
  action: z.enum(["APPROVED", "REJECTED", "PENDING"]),
});

export async function bulkModerateEvents(input: {
  eventIds: string[];
  action: "APPROVED" | "REJECTED" | "PENDING";
}) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = bulkModerateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { eventIds, action } = parsed.data;
  const tenantId = session.user.tenantId;

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
        data: { tenantId, userId: session.user.id, eventId: event.id, action: `event.${action.toLowerCase()}` },
      })
    ),
  ]);

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