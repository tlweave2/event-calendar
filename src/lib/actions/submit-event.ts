"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sendAdminNotification, sendSubmissionConfirmation } from "@/lib/email";
import { checkEventLimit } from "@/lib/plan-limits";
import { createEventSeries, MAX_SERIES_OCCURRENCES } from "@/lib/event-series";
import { demoFormError, isDemoTenant } from "@/lib/demo-guard";
import { deliverWebhook } from "@/lib/webhook";
import { verifySession, can } from "@/lib/authz";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getAppBaseUrl } from "@/lib/urls";

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
  occurrences: z.number().int().min(1).max(MAX_SERIES_OCCURRENCES).optional(),
});

/** Public submissions per IP, per calendar, per hour. */
const SUBMISSIONS_PER_HOUR = 10;

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

  const series =
    data.recurrence && data.occurrences && data.occurrences > 1
      ? { rule: data.recurrence, occurrences: data.occurrences }
      : null;
  const eventCount = series?.occurrences ?? 1;

  // Auto-approval requires an actual signed-in session with moderation rights.
  // Matching on the submitted email address alone meant anyone who knew an
  // admin's address — usually public — could publish straight to the calendar.
  const session = await verifySession();
  const isTenantModerator =
    session !== null &&
    session.tenantId === tenant.id &&
    can(session.role, "events:moderate");
  const status = isTenantModerator ? "APPROVED" : "PENDING";

  if (!isTenantModerator) {
    const ip = getClientIp(await headers());
    const limit = await rateLimit(
      `submit:${tenant.id}:${ip}`,
      SUBMISSIONS_PER_HOUR,
      60 * 60
    );
    if (!limit.allowed) {
      return {
        success: false,
        errors: {
          _form: ["Too many submissions from this network. Please try again later."],
        },
      };
    }
  }

  // Count every occurrence against the quota. Checking as though a series were
  // one event let a 52-occurrence submission sail past a 5-event plan limit.
  const limitCheck = await checkEventLimit(tenant.id, eventCount);
  if (!limitCheck.allowed) {
    return {
      success: false,
      limitReached: true,
      errors: {
        _form: [
          eventCount > 1
            ? `This calendar has ${limitCheck.remaining} of its ${limitCheck.limit} monthly events left, and this series needs ${eventCount}. The calendar administrator can upgrade to Pro for unlimited events.`
            : `This calendar has reached its monthly limit of ${limitCheck.limit} events. The calendar administrator can upgrade to Pro for unlimited events.`,
        ],
      },
    };
  }

  if (series) {
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
      rule: series.rule,
      occurrences: series.occurrences,
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

    if (!isTenantModerator) {
      const admins = await prisma.user.findMany({
        where: { tenantId: tenant.id },
        select: { email: true },
      });

      const adminUrl = `${getAppBaseUrl()}/admin`;

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

    // Fire webhook for event.created (series) — non-blocking
    if (firstEvent?.id) {
      deliverWebhook(tenant.id, {
        type: "event.created",
        payload: {
          eventId: firstEvent.id,
          title: data.title,
          occurrences: data.occurrences,
          recurrence: data.recurrence,
        },
      }).catch((err) => console.error("[webhook] event.created (series) failed:", err));
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

  if (!isTenantModerator) {
    const admins = await prisma.user.findMany({
      where: { tenantId: tenant.id },
      select: { email: true },
    });

    const adminUrl = `${getAppBaseUrl()}/admin`;

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

  // Fire webhook for event.created — non-blocking
  deliverWebhook(tenant.id, {
    type: "event.created",
    payload: {
      eventId: event.id,
      title: event.title,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt?.toISOString() ?? null,
      status: event.status,
    },
  }).catch((err) => console.error("[webhook] event.created failed:", err));

  revalidatePath(`/embed/${tenantSlug}/calendar`);

  return { success: true, eventId: event.id };
}
