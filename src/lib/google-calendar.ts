import { parseICS, expandEvents } from "@/lib/ics-parser";
import { getValidAccessToken, listEvents } from "@/lib/google-calendar-oauth";
import type { EventWithCategory } from "@/lib/prisma-tenant";

const EXPANSION_MONTHS = 12;
const REVALIDATE_SECONDS = 600;
const LOOKBACK_DAYS = 1;
const GCAL_PREFIX = "gcal_";

export function isGoogleEventId(id: string): boolean {
  return id.startsWith(GCAL_PREFIX);
}

export type GoogleEvent = EventWithCategory & { source: "google" };

export type GoogleCalendarTenant = {
  id: string;
  googleCalendarIcsUrl?: string | null;
  googleCalendarAccessToken?: string | null;
  googleCalendarRefreshToken?: string | null;
  googleCalendarTokenExpiresAt?: Date | null;
  googleCalendarId?: string | null;
};

export async function getGoogleCalendarEvents(
  tenant: GoogleCalendarTenant
): Promise<GoogleEvent[]> {
  if (tenant.googleCalendarAccessToken && tenant.googleCalendarId) {
    return getGoogleCalendarEventsViaApi(tenant);
  }
  return getGoogleCalendarEventsViaIcs(tenant.id, tenant.googleCalendarIcsUrl);
}

async function getGoogleCalendarEventsViaApi(
  tenant: GoogleCalendarTenant
): Promise<GoogleEvent[]> {
  const accessToken = await getValidAccessToken({
    id: tenant.id,
    googleCalendarAccessToken: tenant.googleCalendarAccessToken ?? null,
    googleCalendarRefreshToken: tenant.googleCalendarRefreshToken ?? null,
    googleCalendarTokenExpiresAt: tenant.googleCalendarTokenExpiresAt ?? null,
  });
  if (!accessToken || !tenant.googleCalendarId) return [];

  const now = new Date();
  const windowStart = new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000);
  const windowEnd = new Date(now);
  windowEnd.setMonth(windowEnd.getMonth() + EXPANSION_MONTHS);

  try {
    const events = await listEvents(
      accessToken,
      tenant.googleCalendarId,
      windowStart,
      windowEnd,
      tenant.id
    );

    return events
      .filter((ev) => ev.start?.dateTime || ev.start?.date)
      .map((ev) => {
        const start = new Date((ev.start.dateTime ?? ev.start.date) as string);
        const end =
          ev.end?.dateTime || ev.end?.date
            ? new Date((ev.end.dateTime ?? ev.end.date) as string)
            : null;

        return {
          id: `${GCAL_PREFIX}${ev.id}`,
          title: ev.summary?.trim() || "Untitled event",
          description: ev.description ?? null,
          startAt: start,
          endAt: end,
          locationName: ev.location ?? null,
          address: null,
          imageUrl: null,
          ticketUrl: ev.htmlLink ?? null,
          cost: null,
          status: "APPROVED" as const,
          submitterName: null,
          submitterEmail: null,
          seriesId: null,
          seriesIndex: null,
          categoryId: null,
          tenantId: tenant.id,
          createdAt: start,
          updatedAt: start,
          category: null,
          source: "google" as const,
        };
      });
  } catch (err) {
    console.error("[gcal] API fetch failed:", err);
    return [];
  }
}

async function getGoogleCalendarEventsViaIcs(
  tenantId: string,
  icsUrl: string | null | undefined
): Promise<GoogleEvent[]> {
  if (!icsUrl) return [];

  let raw: string;
  try {
    const res = await fetch(icsUrl, {
      next: { revalidate: REVALIDATE_SECONDS, tags: [`gcal-${tenantId}`] },
      headers: { "User-Agent": "Eventful/1.0" },
    });
    if (!res.ok) {
      console.error(`[gcal] feed ${res.status} for tenant ${tenantId}`);
      return [];
    }
    raw = await res.text();
  } catch (err) {
    console.error("[gcal] fetch failed:", err);
    return [];
  }

  let events;
  try {
    const parsed = parseICS(raw);
    const now = new Date();
    const windowStart = new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000);
    const windowEnd = new Date(now);
    windowEnd.setMonth(windowEnd.getMonth() + EXPANSION_MONTHS);
    events = expandEvents(parsed, windowStart, windowEnd);
  } catch (err) {
    console.error("[gcal] parse/expand failed:", err);
    return [];
  }

  return events.map((ev) => {
    const id = `${GCAL_PREFIX}${ev.uid}_${ev.start.getTime()}`;
    return {
      id,
      title: ev.summary?.trim() || "Untitled event",
      description: ev.description,
      startAt: ev.start,
      endAt: ev.end,
      locationName: ev.location,
      address: null,
      imageUrl: null,
      ticketUrl: ev.url,
      cost: null,
      status: "APPROVED" as const,
      submitterName: null,
      submitterEmail: null,
      seriesId: null,
      seriesIndex: null,
      categoryId: null,
      tenantId,
      createdAt: ev.start,
      updatedAt: ev.start,
      category: null,
      source: "google" as const,
    };
  });
}
