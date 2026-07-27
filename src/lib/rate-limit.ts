import { prisma } from "@/lib/prisma";

const WINDOW_MS = 60 * 60 * 1000;
const EMAIL_LIMIT = 5;
const IP_LIMIT = 10;

export async function checkSubmissionRateLimit(
  tenantId: string,
  email: string,
  ip: string | null
): Promise<{ allowed: boolean; reason?: string }> {
  const since = new Date(Date.now() - WINDOW_MS);

  const emailCount = await prisma.event.count({
    where: { tenantId, submitterEmail: email, createdAt: { gte: since } },
  });
  if (emailCount >= EMAIL_LIMIT) {
    return {
      allowed: false,
      reason: "Too many submissions from this email address. Please try again in an hour.",
    };
  }

  if (ip) {
    const ipCount = await prisma.event.count({
      where: { tenantId, submitterIp: ip, createdAt: { gte: since } },
    });
    if (ipCount >= IP_LIMIT) {
      return {
        allowed: false,
        reason: "Too many submissions from this network. Please try again in an hour.",
      };
    }
  }

  return { allowed: true };
}

export function getClientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return headers.get("x-real-ip");
}
