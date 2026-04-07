"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { demoFormError, isDemoTenant } from "@/lib/demo-guard";

const brandingSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(2).max(255),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  timezone: z.string().min(1),
  slug: z.string().min(2).max(60),
});

type BrandingSuccess = { success: true; slug: string };
type BrandingFailure = {
  success: false;
  errors: Record<string, string[] | undefined>;
};

export async function updateTenantBranding(
  input: z.infer<typeof brandingSchema>
): Promise<BrandingSuccess | BrandingFailure> {
  const session = await auth();
  if (!session || session.user.tenantId !== input.tenantId) {
    return { success: false, errors: { _form: ["Unauthorized"] } };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { id: true, slug: true },
  });
  if (tenant && isDemoTenant(tenant.id, tenant.slug)) {
    return demoFormError();
  }

  const parsed = brandingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { tenantId, slug, ...data } = parsed.data;

  // Check slug is not taken by another tenant.
  const conflict = await prisma.tenant.findFirst({
    where: { slug, NOT: { id: tenantId } },
  });
  if (conflict) {
    return { success: false, errors: { slug: ["That URL is already taken"] } };
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { ...data, slug },
  });

  revalidatePath(`/setup/${slug}`);
  return { success: true, slug };
}

const categoriesSchema = z.object({
  tenantId: z.string().uuid(),
  categories: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1).max(100),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      sortOrder: z.number(),
    })
  ),
});

export async function updateTenantCategories(
  input: z.infer<typeof categoriesSchema>
) {
  const session = await auth();
  if (!session || session.user.tenantId !== input.tenantId) {
    return { success: false, errors: { _form: ["Unauthorized"] } };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { id: true, slug: true },
  });
  if (tenant && isDemoTenant(tenant.id, tenant.slug)) {
    return demoFormError();
  }

  const parsed = categoriesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { tenantId, categories } = parsed.data;

  // Delete all existing, recreate - simplest for a wizard step.
  await prisma.$transaction([
    prisma.category.deleteMany({ where: { tenantId } }),
    prisma.category.createMany({
      data: categories.map((cat) => ({
        tenantId,
        name: cat.name,
        color: cat.color ?? null,
        sortOrder: cat.sortOrder,
      })),
    }),
  ]);

  return { success: true };
}

const embedSettingsSchema = z.object({
  tenantId: z.string().uuid(),
  embedFontFamily: z.string().max(100).optional().nullable(),
  embedDefaultView: z.enum(["list", "grid"]).default("grid"),
  embedHideSearch: z.boolean().default(false),
  embedHideCategories: z.boolean().default(false),
  embedHideSubmit: z.boolean().default(false),
  embedBgColor: z.string().max(20).optional().nullable(),
  embedDarkMode: z.boolean().default(false),
});

export async function updateEmbedSettings(
  input: z.infer<typeof embedSettingsSchema>
) {
  const session = await auth();
  if (!session || session.user.tenantId !== input.tenantId) {
    return { success: false, errors: { _form: ["Unauthorized"] } };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { id: true, slug: true },
  });
  if (tenant && isDemoTenant(tenant.id, tenant.slug)) {
    return demoFormError();
  }

  const parsed = embedSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { tenantId, ...data } = parsed.data;

  await prisma.tenant.update({
    where: { id: tenantId },
    data,
  });

  revalidatePath("/admin/embed");
  return { success: true };
}