import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/admin/login",
    verifyRequest: "/admin/login?verify=1",
  },
  callbacks: {
    // Let src/proxy.ts be the single source of route protection logic.
    authorized: () => true,
  },
  providers: [],
};
