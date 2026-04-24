import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicAdminRoute =
        nextUrl.pathname.startsWith("/admin/login") ||
        nextUrl.pathname.startsWith("/admin/register");
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      if (isAdminRoute && !isPublicAdminRoute) return isLoggedIn;
      return true;
    },
  },
  providers: [],
};
