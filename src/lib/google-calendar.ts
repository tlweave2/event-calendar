import { parseICS, expandEvents } from "@/lib/ics-parser";
import type { EventWithCategory } from "@/lib/prisma-tenant";
import { MAX_ICS_BYTES, readCapped, safeFetch } from "@/lib/safe-fetch";

const EXPANSION_MONTHS = 12;
const REVALIDATE_SECONDS = 600;
const LOOKBACK_DAYS = 1;
const GCAL_PREFIX = "gcal_";

export function isGoogleEventId(id: string): boolean {
  return id.startsWith(GCAL_PREFIX);
}

export type GoogleEvent = EventWithCategory & { source: "google" };

export async function getGoogleCalendarEvents(
  tenantId: string,
  icsUrl: string | null | undefined,
): Promise<GoogleEvent[]> {
  if (!icsUrl) return [];

  let raw: string;
  try {
    // The URL comes from tenant settings, so it goes through the SSRF guards
    // rather than straight to fetch.
    const res = await safeFetch(
      icsUrl,
      {
        next: { revalidate: REVALIDATE_SECONDS, tags: [`gcal-${tenantId}`] },
        headers: { "User-Agent": "Eventful/1.0" },
      },
      { maxBytes: MAX_ICS_BYTES }
    );
    if (!res.ok) {
      console.error(`[gcal] feed ${res.status} for tenant ${tenantId}`);
      return [];
    }
    raw = await readCapped(res, MAX_ICS_BYTES);
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
