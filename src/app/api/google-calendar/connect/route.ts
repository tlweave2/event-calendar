import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildAuthUrl, isGoogleCalendarOAuthConfigured } from "@/lib/google-calendar-oauth";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://www.useventful.com";

export async function GET() {
  const session = await auth();
  if (!session?.user.tenantId) {
    return NextResponse.redirect(new URL("/admin/login", BASE_URL));
  }

  if (!isGoogleCalendarOAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/admin/settings?gcal_error=not_configured", BASE_URL)
    );
  }

  const state = randomBytes(24).toString("hex");
  const response = NextResponse.redirect(buildAuthUrl(state));
  response.cookies.set("gcal_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
