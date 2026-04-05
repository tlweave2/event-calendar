import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { logoUrl } = await req.json();

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { logoUrl: logoUrl || null },
  });

  return NextResponse.json({ success: true });
}
