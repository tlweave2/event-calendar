import { prisma } from "@/lib/prisma";
import { EventStatus } from "@prisma/client";

export type EventWithCategory = {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  locationName: string | null;
  address: string | null;
  imageUrl: string | null;
  ticketUrl: string | null;
  cost: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submitterName: string | null;
  submitterEmail: string | null;
  categoryId: string | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string; color: string | null } | null;
};

export function getEvents(tenantId: string, status?: EventStatus): Promise<EventWithCategory[]> {
  return prisma.event.findMany({
    where: { tenantId, ...(status ? { status } : {}) },
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

export function updateEventStatus(tenantId: string, eventId: string, status: EventStatus, userId: string) {
  return prisma.$transaction([
    prisma.event.update({ where: { id: eventId, tenantId }, data: { status } }),
    prisma.auditLog.create({ data: { tenantId, userId, eventId, action: `event.${status.toLowerCase()}` } }),
  ]);
}

export function getCategories(tenantId: string) {
  return prisma.category.findMany({ where: { tenantId }, orderBy: { sortOrder: "asc" } });
}

export function getTenantUsers(tenantId: string) {
  return prisma.user.findMany({ where: { tenantId }, orderBy: { createdAt: "asc" } });
}
