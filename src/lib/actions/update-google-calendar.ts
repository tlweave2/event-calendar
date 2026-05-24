"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DEMO_LOCK_MESSAGE, isDemoTenant } from "@/lib/demo-guard";

const schema = z.object({
  icsUrl: z.union([z.string().url().max(500), z.literal("")]),
});

export async function updateGoogleCalendar(input: { icsUrl: string }) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid URL." };
  }

  const tenantId = session.user.tenantId;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true },
  });
  if (tenant && isDemoTenant(tenant.id, tenant.slug)) {
    return { success: false, error: DEMO_LOCK_MESSAGE };
  }

  const icsUrl = parsed.data.icsUrl || null;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { googleCalendarIcsUrl: icsUrl },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}
