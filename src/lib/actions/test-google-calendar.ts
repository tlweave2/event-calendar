"use server";

import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  icsUrl: z.string().url().max(500),
});

export async function testGoogleCalendar(input: {
  icsUrl: string;
}): Promise<{ success: boolean; count?: number; error?: string }> {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid URL." };

  let raw: string;
  try {
    const res = await fetch(parsed.data.icsUrl, {
      cache: "no-store",
      headers: { "User-Agent": "Eventful/1.0" },
    });
    if (!res.ok) {
      return {
        success: false,
        error: `Feed returned HTTP ${res.status}. Make sure the calendar is public and the URL is correct.`,
      };
    }
    const contentType = res.headers.get("content-type") ?? "";
    raw = await res.text();

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
  } catch {
    return {
      success: false,
      error: "Could not reach the URL. Check that it is publicly accessible.",
    };
  }

  try {
    const icalLib = await import("node-ical");
    const parsed2 = await icalLib.async.parseICS(raw);
    const count = Object.values(parsed2).filter((c) => c?.type === "VEVENT").length;
    return { success: true, count };
  } catch (err) {
    return {
      success: false,
      error: `ICS parse error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
