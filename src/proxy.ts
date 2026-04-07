import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Already-authenticated users should not see the login page — send them
  // to the dashboard (or wherever callbackUrl points).  This prevents the
  // admin layout from wrapping the login form with sidebar / demo banner.
  if (pathname.startsWith("/admin/login") && req.auth) {
    const raw = req.nextUrl.searchParams.get("callbackUrl") ?? "/admin";
    // Only allow relative paths (prevent open-redirect via absolute URLs).
    const dest = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/admin";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/login") &&
    !pathname.startsWith("/admin/accept-invite")
  ) {
    if (!req.auth) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/embed/:path*"],
};
