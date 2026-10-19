import { test } from "node:test";
import assert from "node:assert/strict";
import { expandEvents, parseICS } from "./ics-parser";

const ics = (...events: string[]) =>
  ["BEGIN:VCALENDAR", "VERSION:2.0", ...events, "END:VCALENDAR"].join("\r\n");

const vevent = (...lines: string[]) => ["BEGIN:VEVENT", ...lines, "END:VEVENT"].join("\r\n");

test("parses a basic event with escaped text and folded lines", () => {
  const [ev] = parseICS(
    ics(
      vevent(
        "UID:abc@google.com",
        "SUMMARY:Jazz\\, Blues & More",
        "DESCRIPTION:Line one\\nLine two that is folded",
        "  onto the next line",
        "LOCATION:Bandshell\; Central Park",
        "DTSTART:20261114T020000Z",
        "DTEND:20261114T040000Z",
      ),
    ),
  );
  assert.equal(ev.uid, "abc@google.com");
  assert.equal(ev.summary, "Jazz, Blues & More");
  assert.equal(ev.description, "Line one\nLine two that is folded onto the next line");
  assert.equal(ev.location, "Bandshell; Central Park");
  assert.equal(ev.start.toISOString(), "2026-11-14T02:00:00.000Z");
  assert.equal(ev.end?.toISOString(), "2026-11-14T04:00:00.000Z");
});

test("skips events without a start date", () => {
  assert.equal(parseICS(ics(vevent("UID:x", "SUMMARY:No date"))).length, 0);
});

test("converts TZID local times to UTC", () => {
  const [ev] = parseICS(ics(vevent("UID:tz", "DTSTART;TZID=America/Los_Angeles:20260115T090000")));
  // 9am Pacific in January (PST, UTC-8)
  assert.equal(ev.start.toISOString(), "2026-01-15T17:00:00.000Z");
});

test("expands a weekly series inside the window, honouring COUNT and EXDATE", () => {
  const events = parseICS(
    ics(
      vevent(
        "UID:weekly",
        "DTSTART:20260105T180000Z",
        "DTEND:20260105T190000Z",
        "RRULE:FREQ=WEEKLY;COUNT=4",
        "EXDATE:20260112T180000Z",
      ),
    ),
  );
  const out = expandEvents(events, new Date("2026-01-01T00:00:00Z"), new Date("2026-03-01T00:00:00Z"));
  assert.deepEqual(
    out.map((e) => e.start.toISOString()),
    ["2026-01-05T18:00:00.000Z", "2026-01-19T18:00:00.000Z", "2026-01-26T18:00:00.000Z"],
  );
  assert.equal(out[0].end?.toISOString(), "2026-01-05T19:00:00.000Z");
});

test("expands monthly BYDAY ordinals such as the last Friday", () => {
  const events = parseICS(
    ics(vevent("UID:monthly", "DTSTART:20260130T180000Z", "RRULE:FREQ=MONTHLY;BYDAY=-1FR;COUNT=3")),
  );
  const out = expandEvents(events, new Date("2026-01-01T00:00:00Z"), new Date("2026-12-31T00:00:00Z"));
  assert.deepEqual(
    out.map((e) => e.start.toISOString().slice(0, 10)),
    ["2026-01-30", "2026-02-27", "2026-03-27"],
  );
});

test("drops one-off events outside the window", () => {
  const events = parseICS(ics(vevent("UID:old", "DTSTART:20250101T000000Z")));
  assert.equal(expandEvents(events, new Date("2026-01-01"), new Date("2026-02-01")).length, 0);
});

test("monthly BYDAY still finds occurrences when the window starts mid-series", () => {
  const events = parseICS(
    ics(vevent("UID:m2", "DTSTART:20260131T180000Z", "RRULE:FREQ=MONTHLY;BYDAY=1MO")),
  );
  const out = expandEvents(events, new Date("2026-04-03T00:00:00Z"), new Date("2026-06-30T00:00:00Z"));
  assert.deepEqual(
    out.map((e) => e.start.toISOString().slice(0, 10)),
    ["2026-04-06", "2026-05-04", "2026-06-01"],
  );
});
