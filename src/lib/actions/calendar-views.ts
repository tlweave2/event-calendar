"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { demoFormError, isDemoTenant } from "@/lib/demo-guard";

const createViewSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  categoryIds: z.array(z.string().uuid()).min(1, "Select at least one category"),
});

const updateViewSchema = createViewSchema.extend({
  viewId: z.string().uuid(),
});

export async function createCalendarView(input: {
  name: string;
  slug: string;
  categoryIds: string[];
}) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  const tenantId = session.user.tenantId;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true },
  });
  if (tenant && isDemoTenant(tenant.id, tenant.slug)) {
    return { success: false, error: "Demo mode is read-only" };
  }

  const parsed = createViewSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.calendarView.findFirst({
    where: { tenantId, slug: parsed.data.slug },
  });
  if (existing) {
    return { success: false, error: "A view with that URL already exists" };
  }

  const view = await prisma.calendarView.create({
    data: {
      tenantId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      categoryIds: parsed.data.categoryIds,
    },
  });

  revalidatePath("/admin/views");
  return { success: true, viewId: view.id };
}

export async function updateCalendarView(input: {
  viewId: string;
  name: string;
  slug: string;
  categoryIds: string[];
}) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  const tenantId = session.user.tenantId;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true },
  });
  if (tenant && isDemoTenant(tenant.id, tenant.slug)) {
    return demoFormError();
  }

  const parsed = updateViewSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const view = await prisma.calendarView.findFirst({
    where: { id: parsed.data.viewId, tenantId },
  });
  if (!view) return { success: false, error: "View not found" };

  const conflict = await prisma.calendarView.findFirst({
    where: { tenantId, slug: parsed.data.slug, NOT: { id: view.id } },
  });
  if (conflict) {
    return { success: false, error: "A view with that URL already exists" };
  }

  await prisma.calendarView.update({
    where: { id: view.id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      categoryIds: parsed.data.categoryIds,
    },
  });

  revalidatePath("/admin/views");
  return { success: true };
}

export async function deleteCalendarView(viewId: string) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  const view = await prisma.calendarView.findFirst({
    where: { id: viewId, tenantId: session.user.tenantId },
  });
  if (!view) return { success: false, error: "View not found" };

  await prisma.calendarView.delete({ where: { id: view.id } });

  revalidatePath("/admin/views");
  return { success: true };
}
