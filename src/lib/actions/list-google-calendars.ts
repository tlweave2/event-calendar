"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken, listCalendars } from "@/lib/google-calendar-oauth";

export async function listConnectedGoogleCalendars() {
  const session = await auth();
  if (!session?.user.tenantId) return { success: false as const, error: "Unauthorized" };

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      id: true,
      googleCalendarAccessToken: true,
      googleCalendarRefreshToken: true,
      googleCalendarTokenExpiresAt: true,
    },
  });
  if (!tenant) return { success: false as const, error: "Tenant not found" };

  const accessToken = await getValidAccessToken(tenant);
  if (!accessToken) return { success: false as const, error: "Not connected" };

  try {
    const calendars = await listCalendars(accessToken);
    return { success: true as const, calendars };
  } catch (err) {
    console.error("[gcal] list calendars failed:", err);
    return { success: false as const, error: "Failed to load calendars from Google." };
  }
}
