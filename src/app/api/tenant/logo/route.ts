import { authorize } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  logoUrl: z.union([z.string().url().max(1000), z.literal(""), z.null()]),
});

export async function POST(req: NextRequest) {
  // Branding is an admin-level change, not something every editor may do.
  const authorized = await authorize("settings:write");
  if (!authorized.ok) {
    return NextResponse.json({ error: authorized.error }, { status: authorized.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "logoUrl must be a valid URL" }, { status: 400 });
  }

  await prisma.tenant.update({
    where: { id: authorized.ctx.tenantId },
    data: { logoUrl: parsed.data.logoUrl || null },
  });

  return NextResponse.json({ success: true });
}
