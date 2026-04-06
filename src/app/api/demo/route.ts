import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const demoUser = await prisma.user.findFirst({
    where: { email: "demo@eventful.app" },
    include: { tenant: true },
  });

  const origin = new URL(request.url).origin;

  if (!demoUser) {
    return NextResponse.redirect(new URL("/signup", origin));
  }

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "AUTH_SECRET is not configured" },
      { status: 500 }
    );
  }

  const secureCookie = process.env.NODE_ENV === "production";
  const cookieName = secureCookie
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const token = await encode({
    token: {
      sub: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
      tenantId: demoUser.tenantId,
      tenantSlug: demoUser.tenant.slug,
      role: demoUser.role,
    },
    secret,
    salt: cookieName,
    maxAge: 60 * 60,
  });

  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  return NextResponse.redirect(new URL("/admin", origin));
}
