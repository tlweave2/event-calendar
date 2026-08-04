"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hashToken, parseInviteIdentifier } from "@/lib/tokens";
import { checkSeatLimit } from "@/lib/plan-limits";
import { rateLimit } from "@/lib/rate-limit";
import { Role } from "@generated/prisma/enums";

const acceptSchema = z.object({
  token: z.string().min(1),
  name: z.string().max(255).optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200, "Password is too long"),
});

export type AcceptInviteResult = { success: true } | { success: false; error: string };

/**
 * Redeem an invitation and set the new member's password.
 *
 * Setting a password here is what makes the account usable: sign-in requires a
 * stored bcrypt hash, so an invited user without one could never log in.
 */
export async function acceptInvite(input: {
  token: string;
  name?: string;
  password: string;
}): Promise<AcceptInviteResult> {
  const parsed = acceptSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid request.";
    return { success: false, error: first };
  }

  const { token, password, name } = parsed.data;
  const hashed = hashToken(token);

  // Throttle redemption attempts so the token space cannot be probed.
  const limit = await rateLimit(`invite:${hashed.slice(0, 32)}`, 10, 15 * 60);
  if (!limit.allowed) {
    return { success: false, error: "Too many attempts. Please try again later." };
  }

  const invite = await prisma.verificationToken.findUnique({ where: { token: hashed } });
  if (!invite || invite.expires < new Date()) {
    return { success: false, error: "This invitation link is invalid or has expired." };
  }

  const parsedIdentifier = parseInviteIdentifier(invite.identifier);
  if (!parsedIdentifier) {
    return { success: false, error: "This invitation link is invalid." };
  }

  const { tenantId, email, role } = parsedIdentifier;
  const resolvedRole: Role =
    role === "OWNER" || role === "EDITOR" || role === "ADMIN" ? (role as Role) : "ADMIN";

  const existing = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId, email } },
    select: { id: true },
  });

  // Re-check seats at redemption: the plan may have been downgraded, or other
  // invites accepted, since this one was sent.
  if (!existing) {
    const seats = await checkSeatLimit(tenantId);
    if (!seats.allowed) {
      return {
        success: false,
        error:
          "This workspace has no seats available. Ask an owner to upgrade the plan or free up a seat.",
      };
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.upsert({
      where: { tenantId_email: { tenantId, email } },
      create: {
        tenantId,
        email,
        name: name?.trim() || null,
        role: resolvedRole,
        password: passwordHash,
        // Redeeming a link sent to this address proves control of the mailbox.
        emailVerifiedAt: new Date(),
      },
      update: {
        role: resolvedRole,
        password: passwordHash,
        emailVerifiedAt: new Date(),
        ...(name?.trim() ? { name: name.trim() } : {}),
      },
    }),
    prisma.verificationToken.delete({ where: { token: hashed } }),
    prisma.auditLog.create({
      data: {
        tenantId,
        action: "user.invite_accepted",
        metadata: { email, role: resolvedRole },
      },
    }),
  ]);

  return { success: true };
}
