"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { DEMO_LOCK_MESSAGE, isDemoTenant } from "@/lib/demo-guard";

const schema = z.object({
  calendarId: z.string().min(1),
  calendarSummary: z.string().min(1),
  pushEnabled: z.boolean(),
});

export async function selectGoogleCalendar(input: {
  calendarId: string;
  calendarSummary: string;
  pushEnabled: boolean;
}) {
  const session = await auth();
  if (!session?.user.tenantId) return { success: false, error: "Unauthorized" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

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
      googleCalendarId: parsed.data.calendarId,
      googleCalendarSummary: parsed.data.calendarSummary,
      googleCalendarPushEnabled: parsed.data.pushEnabled,
      googleCalendarSyncEnabled: true,
    },
  });

  revalidatePath("/admin/settings");
  revalidateTag(`gcal-${tenantId}`, "max");
  if (tenant) {
    revalidatePath(`/embed/${tenant.slug}/calendar`);
    revalidatePath(`/embed/${tenant.slug}/events`);
  }
  return { success: true };
}
