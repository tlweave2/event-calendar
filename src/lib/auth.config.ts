import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/admin/login",
    verifyRequest: "/admin/login?verify=1",
  },
  providers: [],
};
