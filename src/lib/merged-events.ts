import { getApprovedEvents, type EventWithCategory } from "@/lib/prisma-tenant";
import { getGoogleCalendarEvents, type GoogleCalendarTenant } from "@/lib/google-calendar";

export async function getMergedApprovedEvents(
  tenant: GoogleCalendarTenant
): Promise<EventWithCategory[]> {
  const [dbEvents, googleEvents] = await Promise.all([
    getApprovedEvents(tenant.id),
    getGoogleCalendarEvents(tenant),
  ]);

  const merged = [...dbEvents, ...googleEvents];
  merged.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  return merged;
}
