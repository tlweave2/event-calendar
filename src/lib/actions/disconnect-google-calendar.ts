"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DEMO_LOCK_MESSAGE, isDemoTenant } from "@/lib/demo-guard";

export async function disconnectGoogleCalendar() {
  const session = await auth();
  if (!session?.user.tenantId) return { success: false, error: "Unauthorized" };

  const tenantId = session.user.tenantId;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true },
  });
  if (tenant && isDemoTenant(tenant.id, tenant.slug)) {
    return { success: false, error: DEMO_LOCK_MESSAGE };
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      googleCalendarAccessToken: null,
      googleCalendarRefreshToken: null,
      googleCalendarTokenExpiresAt: null,
      googleCalendarId: null,
      googleCalendarSummary: null,
      googleCalendarSyncEnabled: false,
      googleCalendarPushEnabled: false,
    },
  });

  revalidatePath("/admin/settings");
  if (tenant) {
    revalidatePath(`/embed/${tenant.slug}/calendar`);
    revalidatePath(`/embed/${tenant.slug}/events`);
  }
  return { success: true };
}
