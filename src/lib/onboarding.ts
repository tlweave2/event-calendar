import { prisma } from "@/lib/prisma";

export type OnboardingStatus = {
  calendarViewed: boolean;
  eventSubmitted: boolean;
  eventApproved: boolean;
  hasSubscriber: boolean;
  complete: boolean;
};

export async function getOnboardingStatus(tenantId: string): Promise<OnboardingStatus> {
  const [calendarViews, submissions, approved, subscribers] = await Promise.all([
    prisma.pageView.count({ where: { tenantId, page: "calendar" } }),
    prisma.event.count({ where: { tenantId } }),
    prisma.event.count({ where: { tenantId, status: "APPROVED" } }),
    prisma.subscriber.count({ where: { tenantId } }),
  ]);

  const calendarViewed = calendarViews > 0;
  const eventSubmitted = submissions > 0;
  const eventApproved = approved > 0;
  const hasSubscriber = subscribers > 0;

  return {
    calendarViewed,
    eventSubmitted,
    eventApproved,
    hasSubscriber,
    complete: calendarViewed && eventSubmitted && eventApproved && hasSubscriber,
  };
}
