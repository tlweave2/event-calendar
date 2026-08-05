"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isSuperadmin } from "@/lib/superadmin";

const ALLOWED_PLANS = ["FREE", "PRO", "ENTERPRISE"] as const;
type AllowedPlan = (typeof ALLOWED_PLANS)[number];

function isAllowedPlan(value: string): value is AllowedPlan {
  return (ALLOWED_PLANS as readonly string[]).includes(value);
}

/**
 * Change a tenant's plan from the operator console.
 *
 * This bypasses Stripe entirely, so it is for comped accounts and support
 * fixes. A tenant with a live subscription will be moved back by the next
 * subscription webhook — cancel in Stripe first if the change should stick.
 */
export async function setTenantPlan(formData: FormData): Promise<void> {
  if (!(await isSuperadmin())) redirect("/superadmin/login");

  const tenantId = String(formData.get("tenantId") ?? "");
  const plan = String(formData.get("plan") ?? "");

  if (!tenantId || !isAllowedPlan(plan)) {
    redirect("/superadmin?error=Invalid+plan+change");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, plan: true, slug: true },
  });
  if (!tenant) redirect("/superadmin?error=Tenant+not+found");

  if (tenant.plan === plan) redirect("/superadmin");

  await prisma.$transaction([
    prisma.tenant.update({ where: { id: tenantId }, data: { plan } }),
    prisma.auditLog.create({
      data: {
        tenantId,
        action: "tenant.plan_changed_by_superadmin",
        metadata: { from: tenant.plan, to: plan },
      },
    }),
  ]);

  revalidatePath("/superadmin");
  redirect(`/superadmin?changed=${encodeURIComponent(tenant.slug)}`);
}
