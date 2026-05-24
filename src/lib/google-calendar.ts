import ical from "node-ical";
import type { EventWithCategory } from "@/lib/prisma-tenant";

const EXPANSION_MONTHS = 12;
const REVALIDATE_SECONDS = 600;
const LOOKBACK_DAYS = 1;
const GCAL_PREFIX = "gcal_";

export function isGoogleEventId(id: string): boolean {
  return id.startsWith(GCAL_PREFIX);
}

export type GoogleEvent = EventWithCategory & { source: "google" };

type EventBase = {
  summary?: string;
  description?: string;
  location?: string;
  url?: string;
};

function makeEvent(
  tenantId: string,
  uid: string,
  start: Date,
  durationMs: number,
  base: EventBase,
): GoogleEvent {
  const startAt = new Date(start);
  const endAt = durationMs > 0 ? new Date(startAt.getTime() + durationMs) : null;
  const id = `${GCAL_PREFIX}${uid}_${startAt.getTime()}`;
  return {
    id,
    title: base.summary?.trim() || "Untitled event",
    description: base.description?.trim() || null,
    startAt,
    endAt,
    locationName: base.location?.trim() || null,
    address: null,
    imageUrl: null,
    ticketUrl: base.url?.trim() || null,
    cost: null,
    status: "APPROVED",
    submitterName: null,
    submitterEmail: null,
    seriesId: null,
    seriesIndex: null,
    categoryId: null,
    tenantId,
    createdAt: startAt,
    updatedAt: startAt,
    category: null,
    source: "google",
  };
}

export async function getGoogleCalendarEvents(
  tenantId: string,
  icsUrl: string | null | undefined,
): Promise<GoogleEvent[]> {
  if (!icsUrl) return [];

  let raw: string;
  try {
    const res = await fetch(icsUrl, {
      next: { revalidate: REVALIDATE_SECONDS },
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

  let parsed: ical.CalendarResponse;
  try {
    parsed = ical.parseICS(raw);
  } catch (err) {
    console.error("[gcal] parse failed:", err);
    return [];
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000);
  const windowEnd = new Date(now);
  windowEnd.setMonth(windowEnd.getMonth() + EXPANSION_MONTHS);

  const out: GoogleEvent[] = [];

  for (const key of Object.keys(parsed)) {
    const comp = parsed[key];
    if (!comp || comp.type !== "VEVENT") continue;

    const vevent = comp as ical.VEvent;
    const uid = (vevent.uid as string) || key;
    const start = vevent.start as Date | undefined;
    if (!start) continue;

    const end = (vevent.end as Date | undefined) ?? null;
    const durationMs = end ? end.getTime() - start.getTime() : 0;

    const base: EventBase = {
      summary: vevent.summary as string | undefined,
      description: vevent.description as string | undefined,
      location: vevent.location as string | undefined,
      url: vevent.url as string | undefined,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rrule = (vevent as any).rrule;
    if (!rrule) {
      if (start >= windowStart && start <= windowEnd) {
        out.push(makeEvent(tenantId, uid, start, durationMs, base));
      }
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exdates: Record<string, Date> = (vevent as any).exdate ?? {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const overrides: Record<string, ical.VEvent> = (vevent as any).recurrences ?? {};
    const exSet = new Set(Object.values(exdates).map((d) => new Date(d).toDateString()));

    let occurrences: Date[] = [];
    try {
      occurrences = rrule.between(windowStart, windowEnd, true);
    } catch (err) {
      console.error(`[gcal] rrule expansion failed for ${uid}:`, err);
      if (start >= windowStart && start <= windowEnd) {
        out.push(makeEvent(tenantId, uid, start, durationMs, base));
      }
      continue;
    }

    for (const occ of occurrences) {
      if (exSet.has(occ.toDateString())) continue;

      const overrideKey = Object.keys(overrides).find(
        (k) => new Date(k).toDateString() === occ.toDateString(),
      );
      if (overrideKey) {
        const ov = overrides[overrideKey];
        const ovStart = (ov.start as Date) ?? occ;
        const ovEnd = ov.end as Date | undefined;
        out.push(
          makeEvent(tenantId, uid, ovStart, ovEnd ? ovEnd.getTime() - ovStart.getTime() : durationMs, {
            summary: (ov.summary as string) ?? base.summary,
            description: (ov.description as string) ?? base.description,
            location: (ov.location as string) ?? base.location,
            url: (ov.url as string) ?? base.url,
          }),
        );
        continue;
      }

      out.push(makeEvent(tenantId, uid, occ, durationMs, base));
    }
  }

  out.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  return out;
}
