import { prisma } from "@/lib/prisma";

/**
 * Who hears about billing for a tenant.
 *
 * Owners first, since they are the ones who can act on a failed payment.
 * Admins are included as a fallback so a workspace whose owner has left is
 * not silently unreachable.
 */
export async function getBillingContacts(tenantId: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { tenantId, role: { in: ["OWNER", "ADMIN"] } },
    select: { email: true, role: true },
    orderBy: { role: "asc" },
  });

  const owners = users.filter((user) => user.role === "OWNER").map((u) => u.email);
  if (owners.length > 0) return owners;

  return users.map((user) => user.email);
}

/** Format a Stripe minor-unit amount for display. */
export function formatAmount(
  amount: number | null | undefined,
  currency: string | null | undefined
): string {
  if (amount === null || amount === undefined) return "your subscription";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency ?? "usd").toUpperCase(),
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${(currency ?? "usd").toUpperCase()}`;
  }
}

export function formatDate(timestampSeconds: number | null | undefined): string | null {
  if (!timestampSeconds) return null;
  return new Date(timestampSeconds * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
