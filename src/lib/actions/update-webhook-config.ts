"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import crypto from "crypto";
import { DEMO_LOCK_MESSAGE, isDemoTenant } from "@/lib/demo-guard";

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
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = fieldErrors.url?.[0] ?? fieldErrors.secret?.[0] ?? "validation failed";
    return { success: false, error: `Invalid input: ${firstError}` };
  }

  const tenantId = session.user.tenantId;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true },
  });
  if (tenant && isDemoTenant(tenant.id, tenant.slug)) {
    return { success: false, error: DEMO_LOCK_MESSAGE };
  }

  const { url, secret, enabled } = parsed.data;

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