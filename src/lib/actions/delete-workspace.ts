"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/authz";
import { getStripe, isBillingConfigured } from "@/lib/stripe";
import { captureError, logInfo } from "@/lib/observability";
import { isDemoTenant } from "@/lib/demo-guard";

/**
 * Permanently delete a workspace and everything in it.
 *
 * Your Terms promise customers they can close their account; until now that
 * meant emailing support and hoping. Owner-only, and the owner must type the
 * workspace slug to confirm — this cascades to every event, category, view,
 * user, and audit record for the tenant and cannot be undone.
 */
export async function deleteWorkspace(
  formData: FormData
): Promise<{ success: false; error: string } | void> {
  const authorized = await authorize("billing:manage");
  if (!authorized.ok) return { success: false, error: authorized.error };

  const confirmation = String(formData.get("confirm") ?? "").trim();

  const tenant = await prisma.tenant.findUnique({
    where: { id: authorized.ctx.tenantId },
    select: {
      id: true,
      slug: true,
      name: true,
      stripeSubscriptionId: true,
      stripeCustomerId: true,
    },
  });
  if (!tenant) return { success: false, error: "Workspace not found." };

  if (isDemoTenant(tenant.id, tenant.slug)) {
    return { success: false, error: "Demo workspaces cannot be deleted." };
  }

  if (confirmation !== tenant.slug) {
    return {
      success: false,
      error: `Type "${tenant.slug}" exactly to confirm deletion.`,
    };
  }

  // Cancel billing first. Deleting the tenant while a subscription is live
  // would keep charging a customer for a workspace that no longer exists.
  if (tenant.stripeSubscriptionId && isBillingConfigured()) {
    try {
      await getStripe().subscriptions.cancel(tenant.stripeSubscriptionId);
    } catch (err) {
      await captureError(err, {
        scope: "workspace.delete.stripe",
        tenantId: tenant.id,
      });
      return {
        success: false,
        error:
          "We could not cancel your subscription automatically. Cancel it from the billing portal first, then try again.",
      };
    }
  }

  await prisma.tenant.delete({ where: { id: tenant.id } });

  logInfo("workspace deleted", {
    scope: "workspace.delete",
    tenantId: tenant.id,
    slug: tenant.slug,
  });

  // The session points at a tenant that no longer exists.
  await signOut({ redirect: false });
  redirect("/?deleted=1");
}
