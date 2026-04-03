import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";

const authConfig = {
  providers: [],
  pages: {
    signIn: "/admin/login",
    verifyRequest: "/admin/login?verify=1",
  },
} satisfies NextAuthConfig;

export const { auth } = NextAuth(authConfig);

export default authConfig;
