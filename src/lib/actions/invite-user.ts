"use server";

import { prisma } from "@/lib/prisma";
import { sendInviteEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkSeatLimit } from "@/lib/plan-limits";
import { Role } from "@generated/prisma/enums";
import { isDemoTenant } from "@/lib/demo-guard";
import { authorize } from "@/lib/authz";
import { getAppBaseUrl } from "@/lib/urls";
import { generateToken, hashToken, inviteIdentifier, TOKEN_TTL } from "@/lib/tokens";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "ADMIN", "EDITOR"]),
});

export async function inviteUser(
  input: FormData | { email: string; role: Role }
): Promise<void> {
  const authorized = await authorize("users:manage");
  if (!authorized.ok) {
    redirect(`/admin/settings?invite_error=${encodeURIComponent(authorized.error)}`);
  }
  const { ctx } = authorized;

  const payload =
    input instanceof FormData
      ? {
          email: String(input.get("email") ?? ""),
          role: String(input.get("role") ?? "ADMIN").toUpperCase(),
        }
      : input;

  const parsed = inviteSchema.safeParse(payload);
  if (!parsed.success) {
    redirect("/admin/settings?invite_error=Invalid+email+or+role.");
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: ctx.tenantId } });
  if (!tenant) return;
  if (isDemoTenant(tenant.id, tenant.slug)) {
    redirect("/admin/settings?invite_error=Invites+are+disabled+in+demo+mode.");
  }

  const email = parsed.data.email.toLowerCase();
  const role = parsed.data.role;

  const existing = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email } },
    select: { id: true },
  });
  if (existing) {
    redirect("/admin/settings?invite_error=That+person+is+already+on+your+team.");
  }

  // Seats are counted as existing members plus outstanding invitations, so a
  // burst of invites cannot overshoot the plan.
  const seats = await checkSeatLimit(tenant.id);
  if (!seats.allowed) {
    redirect(
      `/admin/settings?invite_error=${encodeURIComponent(
        `Your plan includes ${seats.limit} seat${seats.limit === 1 ? "" : "s"} and ${seats.current} are in use. Upgrade to add teammates.`
      )}`
    );
  }

  // The raw token is emailed; only its hash is stored.
  const rawToken = generateToken();
  const identifier = inviteIdentifier(tenant.id, email, role);
  const expires = new Date(Date.now() + TOKEN_TTL.invite);
  const inviteUrl = `${getAppBaseUrl()}/accept-invite?token=${encodeURIComponent(rawToken)}`;

  await prisma.$transaction([
    // Supersede any earlier invitation for this address.
    prisma.verificationToken.deleteMany({ where: { identifier: { startsWith: `invite:${tenant.id}:${email}:` } } }),
    prisma.verificationToken.create({
      data: { identifier, token: hashToken(rawToken), expires },
    }),
    prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: ctx.userId,
        action: "user.invited",
        // Deliberately no invite URL here — an audit log is not a place to
        // keep a credential that grants access to the workspace.
        metadata: { email, role },
      },
    }),
  ]);

  await sendInviteEmail({
    to: email,
    tenantName: tenant.name,
    role,
    inviteUrl,
  });

  revalidatePath("/admin/settings");
  redirect("/admin/settings?invited=1");
}
