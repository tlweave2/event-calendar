import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForTokens } from "@/lib/google-calendar-oauth";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://www.useventful.com";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user.tenantId) {
    return NextResponse.redirect(new URL("/admin/login", BASE_URL));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const storedState = req.cookies.get("gcal_oauth_state")?.value;

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/admin/settings?gcal_error=${encodeURIComponent(oauthError)}`, BASE_URL)
    );
  }

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL("/admin/settings?gcal_error=invalid_state", BASE_URL));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refreshToken) {
      return NextResponse.redirect(
        new URL("/admin/settings?gcal_error=no_refresh_token", BASE_URL)
      );
    }

    await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: {
        googleCalendarAccessToken: tokens.accessToken,
        googleCalendarRefreshToken: tokens.refreshToken,
        googleCalendarTokenExpiresAt: tokens.expiresAt,
        googleCalendarSyncEnabled: true,
      },
    });
  } catch (err) {
    console.error("[gcal-oauth] callback failed:", err);
    return NextResponse.redirect(
      new URL("/admin/settings?gcal_error=token_exchange_failed", BASE_URL)
    );
  }

  const response = NextResponse.redirect(new URL("/admin/settings?gcal_connected=1", BASE_URL));
  response.cookies.delete("gcal_oauth_state");
  return response;
}
