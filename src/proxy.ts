import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Protect all /admin routes except the ones a signed-out user must reach:
  // login, invitation acceptance, and password recovery.
  // Unauthenticated users are redirected to /admin/login with a callbackUrl
  // so they land on their intended page after signing in.
  const publicAdminPaths = [
    "/admin/login",
    "/admin/accept-invite",
    "/admin/forgot-password",
  ];

  if (
    pathname.startsWith("/admin") &&
    !publicAdminPaths.some((path) => pathname.startsWith(path))
  ) {
    if (!req.auth) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Pass the pathname to the server components via a request header.
  // The admin layout uses this to decide whether to show the sidebar/chrome
  // (e.g. skip it on /admin/login so the login form is always standalone).
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
});

export const config = {
  // /superadmin is included so the operator console is never statically
  // cached; the pages check the operator cookie themselves.
  matcher: ["/admin/:path*", "/embed/:path*", "/superadmin/:path*"],
};
