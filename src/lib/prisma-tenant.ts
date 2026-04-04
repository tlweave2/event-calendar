import { prisma } from "@/lib/prisma";
import { EventStatus, type Event, type Category, type User } from "@prisma/client";

// ─── Types ─────────────────────────────────────────────────────────────────

export type EventWithCategory = Event & { category: Category | null };

// ─── Events ────────────────────────────────────────────────────────────────

export function getEvents(tenantId: string, status?: EventStatus): Promise<EventWithCategory[]> {
  return prisma.event.findMany({
    where: {
      tenantId,
      ...(status ? { status } : {}),
    },
    include: { category: true },
    orderBy: { startAt: "asc" },
  });
}

export function getEventById(tenantId: string, eventId: string): Promise<EventWithCategory | null> {
  return prisma.event.findFirst({
    where: { id: eventId, tenantId },
    include: { category: true },
  });
}

export function getPendingEvents(tenantId: string): Promise<EventWithCategory[]> {
  return getEvents(tenantId, EventStatus.PENDING);
}

export function getApprovedEvents(tenantId: string): Promise<EventWithCategory[]> {
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

export function getCategories(tenantId: string): Promise<Category[]> {
  return prisma.category.findMany({
    where: { tenantId },
    orderBy: { sortOrder: "asc" },
  });
}

// ─── Tenant ─────────────────────────────────────────────────────────────────

export function getTenantUsers(tenantId: string): Promise<User[]> {
  return prisma.user.findMany({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
  });
}
