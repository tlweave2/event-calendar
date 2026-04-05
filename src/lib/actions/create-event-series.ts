"use server";

import { addMonths, addWeeks } from "date-fns";
import { prisma } from "@/lib/prisma";

export type RecurrenceRule = "weekly" | "biweekly" | "monthly";

export async function createEventSeries(input: {
  tenantId: string;
  title: string;
  description?: string;
  startAt: Date;
  endAt?: Date | null;
  locationName?: string;
  address?: string;
  categoryId?: string;
  cost?: string;
  ticketUrl?: string;
  imageUrl?: string;
  submitterName?: string;
  submitterEmail?: string;
  status?: "PENDING" | "APPROVED";
  rule: RecurrenceRule;
  occurrences: number;
}): Promise<{ success: true; seriesId: string } | { success: false; error: string }> {
  const { rule, occurrences, startAt, endAt, tenantId, status = "PENDING", ...eventData } = input;

  const count = Math.min(Math.max(occurrences, 1), 52);
  const duration = endAt ? endAt.getTime() - startAt.getTime() : null;

  const dates: Date[] = [];
  for (let index = 0; index < count; index++) {
    if (rule === "weekly") dates.push(addWeeks(startAt, index));
    else if (rule === "biweekly") dates.push(addWeeks(startAt, index * 2));
    else dates.push(addMonths(startAt, index));
  }

  try {
    const series = await prisma.$transaction(async (tx) => {
      const createdSeries = await tx.eventSeries.create({
        data: { tenantId, rule },
      });

      await tx.event.createMany({
        data: dates.map((date, index) => ({
          tenantId,
          title: eventData.title,
          description: eventData.description ?? null,
          startAt: date,
          endAt: duration !== null ? new Date(date.getTime() + duration) : null,
          locationName: eventData.locationName ?? null,
          address: eventData.address ?? null,
          categoryId: eventData.categoryId || null,
          cost: eventData.cost ?? null,
          ticketUrl: eventData.ticketUrl || null,
          imageUrl: eventData.imageUrl ?? null,
          submitterName: eventData.submitterName ?? null,
          submitterEmail: eventData.submitterEmail ?? null,
          status,
          seriesId: createdSeries.id,
          seriesIndex: index + 1,
        })),
      });

      return createdSeries;
    });

    return { success: true, seriesId: series.id };
  } catch (err) {
    console.error("[create-event-series] failed:", err);
    return { success: false, error: "Failed to create series" };
  }
}
