import { getApprovedEvents, type EventWithCategory } from "@/lib/prisma-tenant";
import { getGoogleCalendarEvents } from "@/lib/google-calendar";

export async function getMergedApprovedEvents(tenant: {
  id: string;
  googleCalendarIcsUrl?: string | null;
}): Promise<EventWithCategory[]> {
  const [dbEvents, googleEvents] = await Promise.all([
    getApprovedEvents(tenant.id),
    getGoogleCalendarEvents(tenant.id, tenant.googleCalendarIcsUrl),
  ]);

  const merged = [...dbEvents, ...googleEvents];
  merged.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  return merged;
}
