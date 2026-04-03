import { prisma } from "@/lib/prisma";
import { EventStatus } from "@prisma/client";

// ─── Events ────────────────────────────────────────────────────────────────

export function getEvents(tenantId: string, status?: EventStatus) {
  return prisma.event.findMany({
    where: {
      tenantId,
      ...(status ? { status } : {}),
    },
    include: { category: true },
    orderBy: { startAt: "asc" },
  });
}

export function getEventById(tenantId: string, eventId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, tenantId },
    include: { category: true },
  });
}

export function getPendingEvents(tenantId: string) {
  return getEvents(tenantId, EventStatus.PENDING);
}

export function getApprovedEvents(tenantId: string) {
  return getEvents(tenantId, EventStatus.APPROVED);
}

export function updateEventStatus(
  tenantId: string,
  eventId: string,
  status: EventStatus,
  userId: string
) {
  return prisma.$transaction([
    prisma.event.update({
      where: { id: eventId, tenantId },
      data: { status },
    }),
    prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        eventId,
        action: `event.${status.toLowerCase()}`,
      },
    }),
  ]);
}

// ─── Categories ────────────────────────────────────────────────────────────

export function getCategories(tenantId: string) {
  return prisma.category.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });
}

// ─── Tenant ─────────────────────────────────────────────────────────────────

export function getTenantUsers(tenantId: string) {
  return prisma.user.findMany({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
  });
}
