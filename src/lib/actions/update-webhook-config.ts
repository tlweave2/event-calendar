"use server";

import { authorize } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import crypto from "crypto";
import { DEMO_LOCK_MESSAGE, isDemoTenant } from "@/lib/demo-guard";
import { assertPublicUrl, UnsafeUrlError } from "@/lib/safe-fetch";

const schema = z.object({
  url: z.string().url().max(500),
  secret: z.string().min(16).max(256),
  enabled: z.boolean(),
});

export async function updateWebhookConfig(input: {
  url: string;
  secret: string;
  enabled: boolean;
}) {
  const authorized = await authorize("settings:write");
  if (!authorized.ok) return { success: false, error: authorized.error };
  const ctx = authorized.ctx;

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = fieldErrors.url?.[0] ?? fieldErrors.secret?.[0] ?? "validation failed";
    return { success: false, error: `Invalid input: ${firstError}` };
  }

  const tenantId = ctx.tenantId;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true },
  });
  if (tenant && isDemoTenant(tenant.id, tenant.slug)) {
    return { success: false, error: DEMO_LOCK_MESSAGE };
  }

  const { url, secret, enabled } = parsed.data;

  // Reject destinations we would refuse to call anyway, so the problem
  // surfaces on the settings form rather than silently in delivery logs.
  try {
    await assertPublicUrl(url);
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof UnsafeUrlError
          ? err.message
          : "That webhook URL could not be validated.",
    };
  }

  await prisma.webhookConfig.upsert({
    where: { tenantId },
    create: { tenantId, url, secret, enabled },
    update: { url, secret, enabled },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

/**
 * Generate a cryptographically random webhook secret.
 * Intended to be called from client-side form initialisation.
 */
export async function generateWebhookSecret(): Promise<string> {
  return crypto.randomBytes(32).toString("hex");
}