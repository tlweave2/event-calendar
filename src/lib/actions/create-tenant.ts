"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { slugify } from "@/lib/slugify";

const createTenantSchema = z.object({
  orgName: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function createTenant(input: { orgName: string; email: string; password: string }) {
  const parsed = createTenantSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { orgName, email, password } = parsed.data;

  // Generate a unique slug from org name.
  const baseSlug = slugify(orgName);
  let slug = baseSlug;
  let attempt = 0;

  while (await prisma.tenant.findUnique({ where: { slug } })) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const tenant = await prisma.tenant.create({
    data: {
      slug,
      name: orgName,
      plan: "FREE",
      timezone: "America/New_York",
      categories: {
        create: [
          { name: "Arts & Culture", sortOrder: 0, color: "#7c3aed" },
          { name: "Community", sortOrder: 1, color: "#16a34a" },
          { name: "Music", sortOrder: 2, color: "#db2777" },
          { name: "Sports", sortOrder: 3, color: "#ea580c" },
          { name: "Food & Drink", sortOrder: 4, color: "#ca8a04" },
        ],
      },
    },
  });

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: email.toLowerCase(),
      role: "OWNER",
      password: hashedPassword,
    },
  });

  return { success: true, slug: tenant.slug, tenantId: tenant.id };
}