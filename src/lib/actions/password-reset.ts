"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { getAppBaseUrl } from "@/lib/urls";
import {
  generateToken,
  hashToken,
  parsePasswordResetIdentifier,
  passwordResetIdentifier,
  TOKEN_TTL,
} from "@/lib/tokens";

const requestSchema = z.object({ email: z.string().email() });

const resetSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200, "Password is too long"),
});

/**
 * Always reports success, whether or not the address exists. A form that
 * answers "no such account" is an account enumeration oracle.
 */
export async function requestPasswordReset(input: {
  email: string;
}): Promise<{ success: true }> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { success: true };

  const email = parsed.data.email.toLowerCase().trim();

  const limit = await rateLimit(`pwreset:request:${email}`, 5, 60 * 60);
  if (!limit.allowed) return { success: true };

  // Only accounts that have completed setup can reset; an invited user with no
  // password should redeem their invitation instead.
  const users = await prisma.user.findMany({
    where: { email, password: { not: null } },
    select: { id: true, email: true },
    orderBy: { createdAt: "asc" },
    take: 5,
  });

  for (const user of users) {
    const rawToken = generateToken();
    const identifier = passwordResetIdentifier(user.id);

    try {
      await prisma.$transaction([
        // One live reset token per user.
        prisma.verificationToken.deleteMany({ where: { identifier } }),
        prisma.verificationToken.create({
          data: {
            identifier,
            token: hashToken(rawToken),
            expires: new Date(Date.now() + TOKEN_TTL.passwordReset),
          },
        }),
      ]);

      await sendPasswordResetEmail({
        to: user.email,
        resetUrl: `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`,
        expiresInMinutes: Math.round(TOKEN_TTL.passwordReset / 60000),
      });
    } catch (err) {
      console.error("[password-reset] failed to issue token:", err);
    }
  }

  return { success: true };
}

export type ResetPasswordResult = { success: true } | { success: false; error: string };

export async function resetPassword(input: {
  token: string;
  password: string;
}): Promise<ResetPasswordResult> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid request.",
    };
  }

  const { token, password } = parsed.data;
  const hashed = hashToken(token);

  const limit = await rateLimit(`pwreset:redeem:${hashed.slice(0, 32)}`, 10, 15 * 60);
  if (!limit.allowed) {
    return { success: false, error: "Too many attempts. Please try again later." };
  }

  const record = await prisma.verificationToken.findUnique({ where: { token: hashed } });
  if (!record || record.expires < new Date()) {
    return { success: false, error: "This reset link is invalid or has expired." };
  }

  const userId = parsePasswordResetIdentifier(record.identifier);
  if (!userId) {
    return { success: false, error: "This reset link is invalid." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, tenantId: true, email: true },
  });
  if (!user) {
    return { success: false, error: "This reset link is invalid." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash },
    }),
    prisma.verificationToken.delete({ where: { token: hashed } }),
    // Database-backed sessions are revoked here. JWT sessions already issued
    // stay valid until they expire — see README for the trade-off.
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "user.password_reset",
        metadata: { email: user.email },
      },
    }),
  ]);

  return { success: true };
}
