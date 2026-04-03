import { prisma } from "@/lib/prisma";
import { cache } from "react";

export const getTenantBySlug = cache(async (slug: string) => {
  return prisma.tenant.findUnique({
    where: { slug },
    include: { categories: { orderBy: { sortOrder: "asc" } } },
  });
});

export const getTenantByDomain = cache(async (domain: string) => {
  return prisma.tenant.findFirst({
    where: { customDomain: domain },
    include: { categories: { orderBy: { sortOrder: "asc" } } },
  });
});

export type TenantWithCategories = NonNullable<
  Awaited<ReturnType<typeof getTenantBySlug>>
>;
