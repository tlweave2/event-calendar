import { prisma } from "@/lib/prisma";

export function recordPageView(
  tenantId: string,
  page: "calendar" | "event" | "submit",
  eventId?: string
): void {
  void prisma.pageView.create({
    data: { tenantId, page, eventId: eventId ?? null },
  }).catch((err) => {
    console.error("[page-views] failed to record view:", err);
  });
}
