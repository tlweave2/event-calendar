"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendSubscriptionConfirmation } from "@/lib/email";

const schema = z.object({
  tenantSlug: z.string(),
  email: z.string().email(),
  // Honeypot: real users never see or fill this field.
  website: z.string().optional(),
});

export async function subscribeToCalendar(input: {
  tenantSlug: string;
  email: string;
  website?: string;
}) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Enter a valid email address." };

  if (parsed.data.website) {
    // Honeypot tripped — pretend success, don't create anything.
    return { success: true };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: parsed.data.tenantSlug },
    select: { id: true, name: true, slug: true },
  });
  if (!tenant) return { success: false, error: "Calendar not found." };

  const email = parsed.data.email.toLowerCase();
  const unsubscribeToken = randomBytes(24).toString("hex");

  const subscriber = await prisma.subscriber.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email } },
    update: {},
    create: { tenantId: tenant.id, email, unsubscribeToken },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://www.useventful.com";
  sendSubscriptionConfirmation({
    to: email,
    tenantName: tenant.name,
    calendarUrl: `${baseUrl}/embed/${tenant.slug}/calendar`,
    unsubscribeUrl: `${baseUrl}/api/subscribers/unsubscribe?token=${subscriber.unsubscribeToken}`,
  }).catch((err) => console.error("[email] subscription confirmation failed:", err));

  return { success: true };
}
