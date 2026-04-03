"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";

const acceptSchema = z.object({
  token: z.string().min(1),
});

function parseInviteToken(token: string) {
  const [roleHint, ...rest] = token.split(".");
  return {
    roleHint,
    rawToken: rest.join("."),
  };
}

export async function acceptInvite(input: { token: string }): Promise<void> {
  const parsed = acceptSchema.safeParse(input);
  if (!parsed.success) return;

  const { token } = parsed.data;
  const invite = await prisma.verificationToken.findUnique({ where: { token } });
  if (!invite || invite.expires < new Date()) {
    return;
  }

  const [tenantId, email] = invite.identifier.split(":");
  if (!tenantId || !email) {
    return;
  }

  const { roleHint } = parseInviteToken(token);
  const role = roleHint.toUpperCase();

  await prisma.$transaction([
    prisma.user.upsert({
      where: { tenantId_email: { tenantId, email } },
      create: {
        tenantId,
        email,
        role: role === "OWNER" || role === "EDITOR" ? role : "ADMIN",
      },
      update: {
        role: role === "OWNER" || role === "EDITOR" ? role : "ADMIN",
      },
    }),
    prisma.verificationToken.delete({ where: { token } }),
    prisma.auditLog.create({
      data: {
        tenantId,
        action: "user.invite_accepted",
        metadata: { email, role },
      },
    }),
  ]);

  redirect("/admin/login?invited=1");
}