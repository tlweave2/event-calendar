import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/admin/login",
    verifyRequest: "/admin/login?verify=1",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminPath = nextUrl.pathname.startsWith("/admin");
      const isLoginPage = nextUrl.pathname.startsWith("/admin/login");

      if (isAdminPath && !isLoginPage && !isLoggedIn) return false;
      return true;
    },
  },
  providers: [],
};
