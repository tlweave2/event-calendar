"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInviteEmail } from "@/lib/email";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkAdminUserLimit } from "@/lib/plan-limits";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "ADMIN", "EDITOR"]),
});

function getInviteBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3001";
}

export async function inviteUser(
  input: FormData | { email: string; role: Role }
) : Promise<void> {
  const session = await auth();
  if (!session) return;

  const payload =
    input instanceof FormData
      ? {
          email: String(input.get("email") ?? ""),
          role: String(input.get("role") ?? "ADMIN").toUpperCase(),
        }
      : input;

  const parsed = inviteSchema.safeParse(payload);
  if (!parsed.success) {
    return;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
  });
  if (!tenant) return;

  const userLimit = await checkAdminUserLimit(tenant.id);
  if (!userLimit.allowed) {
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const role = parsed.data.role;
  const token = `${role.toLowerCase()}.${crypto.randomUUID()}`;
  const identifier = `${tenant.id}:${email}`;
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const inviteUrl = `${getInviteBaseUrl()}/accept-invite?token=${encodeURIComponent(token)}`;

  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: session.user.id,
      action: "user.invited",
      metadata: { email, role, inviteUrl },
    },
  });

  await sendInviteEmail({
    to: email,
    tenantName: tenant.name,
    role,
    inviteUrl,
  });

  revalidatePath("/admin/settings");
  redirect("/admin/settings?invited=1");
}