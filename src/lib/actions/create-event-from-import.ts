"use server";

import { authorize } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { isDemoTenant } from "@/lib/demo-guard";
import { checkEventLimit } from "@/lib/plan-limits";
import { deliverWebhook } from "@/lib/webhook";

export async function createEventFromImport(input: {
  tenantId: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  locationName?: string;
  address?: string;
  cost?: string;
  ticketUrl?: string;
  categoryId?: string;
  imageUrl?: string;
}) {
  const authorized = await authorize("events:write");
  if (!authorized.ok || authorized.ctx.tenantId !== input.tenantId) {
    throw new Error("Unauthorized");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    select: { id: true, slug: true },
  });
  if (tenant && isDemoTenant(tenant.id, tenant.slug)) {
    throw new Error("Demo mode is read-only");
  }

  const limitCheck = await checkEventLimit(input.tenantId);
  if (!limitCheck.allowed) {
    throw new Error(
      `Monthly event limit reached (${limitCheck.current}/${limitCheck.limit}). Upgrade to Pro for unlimited events.`
    );
  }

  const event = await prisma.event.create({
    data: {
      tenantId: input.tenantId,
      title: input.title,
      description: input.description,
      startAt: new Date(input.startAt),
      endAt: input.endAt ? new Date(input.endAt) : null,
      locationName: input.locationName,
      address: input.address,
      cost: input.cost,
      ticketUrl: input.ticketUrl || null,
      categoryId: input.categoryId || null,
      imageUrl: input.imageUrl,
      status: "APPROVED",
    },
  });

  // Fire webhook for event.created (imported/approved) — non-blocking
  deliverWebhook(input.tenantId, {
    type: "event.approved",
    payload: {
      eventId: event.id,
      title: event.title,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt?.toISOString() ?? null,
      status: event.status,
    },
  }).catch((err) => console.error("[webhook] event.approved (import) failed:", err));
  revalidatePath("/admin");
  revalidatePath("/admin/events");
}
