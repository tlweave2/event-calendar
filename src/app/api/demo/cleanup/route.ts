import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const expired = await prisma.tenant.findMany({
    where: { isDemoSandbox: true, demoExpiresAt: { lt: new Date() } },
    select: { id: true },
  });

  await prisma.tenant.deleteMany({
    where: { id: { in: expired.map((t) => t.id) } },
  });

  return NextResponse.json({ deleted: expired.length });
}
