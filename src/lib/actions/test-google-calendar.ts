"use server";

import { authorize } from "@/lib/authz";
import { z } from "zod";
import { MAX_ICS_BYTES, safeFetch, readCapped, UnsafeUrlError } from "@/lib/safe-fetch";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  icsUrl: z.string().url().max(500),
});

export async function testGoogleCalendar(input: {
  icsUrl: string;
}): Promise<{ success: boolean; count?: number; error?: string }> {
  const authorized = await authorize("settings:write");
  if (!authorized.ok) return { success: false, error: authorized.error };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid URL." };

  // This action makes the server fetch a URL the caller chose, so cap how
  // often it can be used as a probe.
  const limit = await rateLimit(`ics-test:${authorized.ctx.tenantId}`, 20, 60 * 60);
  if (!limit.allowed) {
    return { success: false, error: "Too many tests. Please try again later." };
  }

  let raw: string;
  try {
    const res = await safeFetch(
      parsed.data.icsUrl,
      { cache: "no-store", headers: { "User-Agent": "Eventful/1.0" } },
      { maxBytes: MAX_ICS_BYTES }
    );
    if (!res.ok) {
      return {
        success: false,
        error: `Feed returned HTTP ${res.status}. Make sure the calendar is public and the URL is correct.`,
      };
    }
    const contentType = res.headers.get("content-type") ?? "";
    raw = await readCapped(res, MAX_ICS_BYTES);

    if (contentType.includes("text/html") || raw.trimStart().startsWith("<")) {
      return {
        success: false,
        error:
          "The URL returned an HTML page instead of a calendar file. Make sure the calendar is set to Public in Google Calendar → Settings → Access permissions.",
      };
    }

    if (!raw.includes("BEGIN:VCALENDAR")) {
      return {
        success: false,
        error: `Unexpected response — not a valid ICS file. First 100 chars: ${raw.slice(0, 100)}`,
      };
    }
  } catch (err) {
    if (err instanceof UnsafeUrlError) {
      return { success: false, error: err.message };
    }
    return {
      success: false,
      error: "Could not reach the URL. Check that it is publicly accessible.",
    };
  }

  try {
    const { parseICS } = await import("@/lib/ics-parser");
    const events = parseICS(raw);
    return { success: true, count: events.length };
  } catch (err) {
    return {
      success: false,
      error: `ICS parse error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
