/**
 * Minimal ICS parser — no external deps, no BigInt, handles Google Calendar output.
 */

export type ParsedEvent = {
  uid: string;
  summary: string;
  description: string | null;
  location: string | null;
  url: string | null;
  start: Date;
  end: Date | null;
  rrule: RRule | null;
  exdates: Set<string>;
};

type RRule = {
  freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  count: number | null;
  until: Date | null;
  byday: string[] | null;
};

// Unfold ICS line continuations (CRLF + whitespace = continuation)
function unfold(raw: string): string {
  return raw.replace(/\r?\n[ \t]/g, "");
}

function unescape(s: string): string {
  return s
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Convert a local date string in a named timezone to a UTC Date using Intl.
function tzLocalToUTC(str: string, tzid: string): Date {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/.exec(str);
  if (!m) return new Date(NaN);
  const [, y, mo, d, h, mi, s] = m;
  try {
    // Treat the numbers as UTC to get an approximate timestamp, then correct
    // for the real UTC offset of the given timezone at that moment.
    const utcGuess = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: tzid,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false,
      })
        .formatToParts(utcGuess)
        .map((p) => [p.type, +p.value]),
    );
    const tzAsUTC = Date.UTC(
      parts.year, parts.month - 1, parts.day,
      parts.hour === 24 ? 0 : parts.hour, parts.minute, parts.second,
    );
    return new Date(utcGuess + (utcGuess - tzAsUTC));
  } catch {
    return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
  }
}

function parseDate(value: string, tzid?: string): Date | null {
  const v = value.trim();
  // DATE only (all-day): YYYYMMDD → noon UTC so it lands on the correct calendar day
  // in all common timezones (midnight UTC = previous day in UTC-1..UTC-12)
  if (/^\d{8}$/.test(v)) {
    return new Date(Date.UTC(+v.slice(0, 4), +v.slice(4, 6) - 1, +v.slice(6, 8), 12, 0, 0));
  }
  // DATE-TIME UTC: ...Z
  if (/^\d{8}T\d{6}Z$/i.test(v)) {
    return new Date(Date.UTC(
      +v.slice(0, 4), +v.slice(4, 6) - 1, +v.slice(6, 8),
      +v.slice(9, 11), +v.slice(11, 13), +v.slice(13, 15),
    ));
  }
  // DATE-TIME local with TZID
  if (/^\d{8}T\d{6}$/.test(v)) {
    if (tzid) return tzLocalToUTC(v, tzid);
    return new Date(Date.UTC(
      +v.slice(0, 4), +v.slice(4, 6) - 1, +v.slice(6, 8),
      +v.slice(9, 11), +v.slice(11, 13), +v.slice(13, 15),
    ));
  }
  return null;
}

function parseRRule(value: string): RRule | null {
  const parts: Record<string, string> = {};
  for (const seg of value.split(";")) {
    const eq = seg.indexOf("=");
    if (eq > 0) parts[seg.slice(0, eq).toUpperCase()] = seg.slice(eq + 1);
  }
  const freq = parts.FREQ as RRule["freq"];
  if (!["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(freq)) return null;
  return {
    freq,
    interval: parts.INTERVAL ? Math.max(1, parseInt(parts.INTERVAL, 10)) : 1,
    count: parts.COUNT ? parseInt(parts.COUNT, 10) : null,
    until: parts.UNTIL ? parseDate(parts.UNTIL) : null,
    byday: parts.BYDAY ? parts.BYDAY.split(",") : null,
  };
}

export function parseICS(raw: string): ParsedEvent[] {
  const text = unfold(raw);
  const events: ParsedEvent[] = [];

  for (const block of text.split("BEGIN:VEVENT").slice(1)) {
    const body = block.split("END:VEVENT")[0];
    const ev: Partial<ParsedEvent> & { exdates: Set<string>; rrule: RRule | null } = {
      uid: "",
      summary: "",
      description: null,
      location: null,
      url: null,
      start: undefined,
      end: null,
      rrule: null,
      exdates: new Set(),
    };

    for (const line of body.split(/\r?\n/)) {
      const ci = line.indexOf(":");
      if (ci < 0) continue;
      const rawProp = line.slice(0, ci);
      const rawVal = line.slice(ci + 1).trim();
      const si = rawProp.indexOf(";");
      const prop = (si >= 0 ? rawProp.slice(0, si) : rawProp).toUpperCase();
      const paramStr = si >= 0 ? rawProp.slice(si + 1) : "";
      const tzid = /TZID=([^;:]+)/.exec(paramStr)?.[1];

      switch (prop) {
        case "UID":          ev.uid = rawVal; break;
        case "SUMMARY":      ev.summary = unescape(rawVal); break;
        case "DESCRIPTION":  ev.description = stripHtml(unescape(rawVal)) || null; break;
        case "LOCATION":     ev.location = unescape(rawVal) || null; break;
        case "URL":          ev.url = rawVal || null; break;
        case "DTSTART":      ev.start = parseDate(rawVal, tzid) ?? undefined; break;
        case "DTEND":        ev.end = parseDate(rawVal, tzid); break;
        case "RRULE":        ev.rrule = parseRRule(rawVal); break;
        case "EXDATE":
          for (const d of rawVal.split(",")) {
            const pd = parseDate(d.trim(), tzid);
            if (pd) ev.exdates.add(pd.toDateString());
          }
          break;
      }
    }

    if (ev.start) events.push(ev as ParsedEvent);
  }

  return events;
}

const DAY_MAP: Record<string, number> = {
  SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
};

// Returns the Nth occurrence (positive = from start, negative = from end) of a
// weekday within the given UTC year/month, at the given UTC time-of-day offset.
function nthWeekdayInMonth(
  year: number, month: number, dayNum: number, n: number, timeMs: number,
): Date | null {
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  let targetDay: number;
  if (n > 0) {
    const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
    targetDay = 1 + ((dayNum - firstDow + 7) % 7) + (n - 1) * 7;
  } else {
    const lastDow = new Date(Date.UTC(year, month, daysInMonth)).getUTCDay();
    targetDay = daysInMonth - ((lastDow - dayNum + 7) % 7) + (n + 1) * 7;
  }
  if (targetDay < 1 || targetDay > daysInMonth) return null;
  return new Date(Date.UTC(year, month, targetDay) + timeMs);
}

export function expandEvents(
  events: ParsedEvent[],
  windowStart: Date,
  windowEnd: Date,
): ParsedEvent[] {
  const out: ParsedEvent[] = [];

  for (const ev of events) {
    if (!ev.rrule) {
      if (ev.start >= windowStart && ev.start <= windowEnd) out.push(ev);
      continue;
    }

    const { freq, interval, count, until, byday } = ev.rrule;
    const duration = ev.end ? ev.end.getTime() - ev.start.getTime() : 0;
    const cursor = new Date(ev.start);
    let n = 0;

    while (cursor <= windowEnd && n < 5000) {
      if (until && cursor > until) break;
      if (count !== null && n >= count) break;

      if (cursor >= windowStart && !ev.exdates.has(cursor.toDateString())) {
        if (freq === "WEEKLY" && byday && byday.length > 0) {
          // Emit one occurrence per matching weekday in this week
          const sunday = new Date(cursor);
          sunday.setUTCDate(sunday.getUTCDate() - sunday.getUTCDay());
          for (const day of byday) {
            const dayNum = DAY_MAP[day.slice(-2).toUpperCase()];
            if (dayNum === undefined) continue;
            const occ = new Date(sunday);
            occ.setUTCDate(sunday.getUTCDate() + dayNum);
            if (occ >= windowStart && occ <= windowEnd && !ev.exdates.has(occ.toDateString())) {
              out.push({
                ...ev,
                start: occ,
                end: duration > 0 ? new Date(occ.getTime() + duration) : null,
              });
            }
          }
        } else if (freq === "MONTHLY" && byday && byday.length > 0) {
          // BYDAY with ordinal prefix, e.g. "4TU" = 4th Tuesday, "-1FR" = last Friday
          const timeMs =
            cursor.getUTCHours() * 3600000 +
            cursor.getUTCMinutes() * 60000 +
            cursor.getUTCSeconds() * 1000;
          for (const day of byday) {
            const m = /^(-?\d+)([A-Z]{2})$/i.exec(day);
            if (!m) continue;
            const ordinal = parseInt(m[1]);
            const dayNum = DAY_MAP[m[2].toUpperCase()];
            if (dayNum === undefined) continue;
            const occ = nthWeekdayInMonth(
              cursor.getUTCFullYear(), cursor.getUTCMonth(), dayNum, ordinal, timeMs,
            );
            if (occ && occ >= windowStart && occ <= windowEnd && !ev.exdates.has(occ.toDateString())) {
              out.push({
                ...ev,
                start: occ,
                end: duration > 0 ? new Date(occ.getTime() + duration) : null,
              });
            }
          }
        } else {
          out.push({
            ...ev,
            start: new Date(cursor),
            end: duration > 0 ? new Date(cursor.getTime() + duration) : null,
          });
        }
      }

      switch (freq) {
        case "DAILY":   cursor.setUTCDate(cursor.getUTCDate() + interval); break;
        case "WEEKLY":  cursor.setUTCDate(cursor.getUTCDate() + interval * 7); break;
        case "MONTHLY": cursor.setUTCMonth(cursor.getUTCMonth() + interval); break;
        case "YEARLY":  cursor.setUTCFullYear(cursor.getUTCFullYear() + interval); break;
      }
      n++;
    }
  }

  return out;
}
