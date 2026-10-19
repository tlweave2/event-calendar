import { prisma } from "@/lib/prisma";

/** Delete demo sandbox calendars whose hour is up. Returns how many. */
export async function deleteExpiredDemos(): Promise<number> {
  const { count } = await prisma.tenant.deleteMany({
    where: { isDemoSandbox: true, demoExpiresAt: { lt: new Date() } },
  });
  return count;
}
