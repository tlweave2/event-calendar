"use server";

import { authorize } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { DEMO_LOCK_MESSAGE, isDemoTenant } from "@/lib/demo-guard";

const schema = z.object({
  icsUrl: z.union([z.string().url().max(500), z.literal("")]),
});

export async function updateGoogleCalendar(input: { icsUrl: string }) {
  const authorized = await authorize("settings:write");
  if (!authorized.ok) return { success: false, error: authorized.error };
  const ctx = authorized.ctx;

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid URL." };
  }

  const tenantId = ctx.tenantId;
  if (!tenantId) return { success: false, error: "Session missing tenant." };

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
  revalidateTag(`gcal-${tenantId}`, "max");
  if (tenant) {
    revalidatePath(`/embed/${tenant.slug}/calendar`);
    revalidatePath(`/embed/${tenant.slug}/events`);
  }
  return { success: true };
}
