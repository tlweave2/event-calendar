"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { slugify } from "@/lib/slugify";
import { sendEmailVerification } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getAppBaseUrl } from "@/lib/urls";
import {
  emailVerificationIdentifier,
  generateToken,
  hashToken,
  TOKEN_TTL,
} from "@/lib/tokens";

const createTenantSchema = z.object({
  orgName: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

const SIGNUPS_PER_IP_PER_HOUR = 5;

export async function createTenant(input: {
  orgName: string;
  email: string;
  password: string;
}) {
  const parsed = createTenantSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  // Signup writes a tenant, categories and a user. Unthrottled, one script can
  // fill the database.
  const ip = getClientIp(await headers());
  const limit = await rateLimit(`signup:ip:${ip}`, SIGNUPS_PER_IP_PER_HOUR, 60 * 60);
  if (!limit.allowed) {
    return {
      success: false,
      errors: {
        email: ["Too many calendars created from this network. Try again later."],
      },
    };
  }

  const { orgName, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Generate a unique slug from org name.
  const baseSlug = slugify(orgName);
  let slug = baseSlug;
  let attempt = 0;

  while (await prisma.tenant.findUnique({ where: { slug } })) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // One statement so a failure cannot leave an owner-less tenant behind.
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
      users: {
        create: {
          email: normalizedEmail,
          role: "OWNER",
          password: hashedPassword,
        },
      },
    },
    include: { users: { select: { id: true } } },
  });

  const owner = tenant.users[0];

  // Verification is best-effort: a mail provider outage must not strand a
  // signup halfway through. Sign-in only requires a verified address when
  // REQUIRE_EMAIL_VERIFICATION is enabled.
  if (owner) {
    try {
      const rawToken = generateToken();
      await prisma.verificationToken.create({
        data: {
          identifier: emailVerificationIdentifier(owner.id),
          token: hashToken(rawToken),
          expires: new Date(Date.now() + TOKEN_TTL.emailVerification),
        },
      });

      await sendEmailVerification({
        to: normalizedEmail,
        tenantName: orgName,
        verifyUrl: `${getAppBaseUrl()}/verify-email?token=${encodeURIComponent(rawToken)}`,
      });
    } catch (err) {
      console.error("[signup] verification email failed:", err);
    }
  }

  return { success: true, slug: tenant.slug, tenantId: tenant.id };
}
