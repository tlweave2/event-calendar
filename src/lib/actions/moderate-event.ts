"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendModerationNotice } from "@/lib/email";
import { DEMO_LOCK_MESSAGE, isDemoTenant } from "@/lib/demo-guard";
import { deliverWebhook } from "@/lib/webhook";
import { getValidAccessToken, insertEvent } from "@/lib/google-calendar-oauth";

const moderateSchema = z.object({
  eventId: z.string().uuid(),
  action: z.enum(["APPROVED", "REJECTED", "PENDING"]),
});

export async function moderateEvent(input: {
  eventId: string;
  action: "APPROVED" | "REJECTED" | "PENDING";
}) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = moderateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { eventId, action } = parsed.data;
  const tenantId = session.user.tenantId;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true },
  });
  if (tenant && isDemoTenant(tenant.id, tenant.slug)) {
    return { success: false, error: DEMO_LOCK_MESSAGE };
  }

  // Confirm event belongs to this tenant
  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId },
  });
  if (!event) return { success: false, error: "Event not found" };

  await prisma.$transaction([
    prisma.event.update({
      where: { id: eventId },
      data: { status: action },
    }),
    prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        eventId,
        action: `event.${action.toLowerCase()}`,
      },
    }),
  ]);

  // Fetch submitter details for notification
  const updatedEvent = await prisma.event.findUnique({
    where: { id: eventId },
    include: { tenant: true },
  });

  // Fire webhook for event.approved — non-blocking
  if (action === "APPROVED" && updatedEvent) {
    deliverWebhook(tenantId, {
      type: "event.approved",
      payload: {
        eventId: updatedEvent.id,
        title: updatedEvent.title,
        startAt: updatedEvent.startAt.toISOString(),
        endAt: updatedEvent.endAt?.toISOString() ?? null,
        status: updatedEvent.status,
        submitterEmail: updatedEvent.submitterEmail,
      },
    }).catch((err) => console.error("[webhook] event.approved failed:", err));
  }

  // Push approved events into the organizer's connected Google Calendar — non-blocking.
  if (
    action === "APPROVED" &&
    updatedEvent &&
    !updatedEvent.googleEventId &&
    updatedEvent.tenant.googleCalendarPushEnabled &&
    updatedEvent.tenant.googleCalendarId
  ) {
    pushEventToGoogleCalendar(updatedEvent).catch((err) =>
      console.error("[gcal] push on approve failed:", err)
    );
  }

  if (updatedEvent?.submitterEmail && action !== "PENDING") {
    const calendarUrl = `${process.env.NEXTAUTH_URL}/embed/${updatedEvent.tenant.slug}/calendar`;

    sendModerationNotice({
      to: updatedEvent.submitterEmail,
      submitterName: updatedEvent.submitterName ?? "there",
      eventTitle: updatedEvent.title,
      tenantName: updatedEvent.tenant.name,
      action: action === "APPROVED" ? "approved" : "rejected",
      calendarUrl,
    }).catch((err) =>
      console.error("[email] moderation notice failed:", err)
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/events");

  return { success: true };
}

type EventWithTenant = NonNullable<
  Awaited<ReturnType<typeof prisma.event.findUnique>>
> & {
  tenant: NonNullable<Awaited<ReturnType<typeof prisma.tenant.findUnique>>>;
};

async function pushEventToGoogleCalendar(event: EventWithTenant) {
  const tenant = event.tenant;
  const accessToken = await getValidAccessToken({
    id: tenant.id,
    googleCalendarAccessToken: tenant.googleCalendarAccessToken,
    googleCalendarRefreshToken: tenant.googleCalendarRefreshToken,
    googleCalendarTokenExpiresAt: tenant.googleCalendarTokenExpiresAt,
  });
  if (!accessToken || !tenant.googleCalendarId) return;

  const location = event.address
    ? `${event.locationName ?? ""} ${event.address}`.trim()
    : event.locationName;

  const inserted = await insertEvent(accessToken, tenant.googleCalendarId, {
    summary: event.title,
    description: event.description,
    location,
    start: event.startAt,
    end: event.endAt ?? new Date(event.startAt.getTime() + 3600_000),
  });

  await prisma.event.update({
    where: { id: event.id },
    data: { googleEventId: inserted.id },
  });
}
