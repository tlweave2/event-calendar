import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@generated/prisma/enums";

const isDev = process.env.NODE_ENV === "development";
const adminLoginEmail = (process.env.ADMIN_LOGIN_EMAIL ?? "admin@test.com").toLowerCase();
const adminLoginPassword = process.env.ADMIN_LOGIN_PASSWORD;

function hasSessionFields(user: unknown): user is { tenantId: string; role: Role } {
  if (!user || typeof user !== "object") return false;
  const candidate = user as Record<string, unknown>;
  return typeof candidate.tenantId === "string" && typeof candidate.role === "string";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },

  providers: [
    Credentials({
      name: isDev ? "Dev Login" : "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findFirst({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            tenantId: true,
            role: true,
            password: true,
          },
        });

        if (!user) {
          console.log("[auth] no user found for:", email);
          return null;
        }

        if (user.password) {
          // Tenant owner with a stored password - verify it with bcrypt.
          const valid = await bcrypt.compare(password, user.password);
          if (!valid) return null;
        } else {
          // Legacy/seeded user with no stored password - fall back to env-based check.
          // In dev, skip the env check so seeded users can still log in without env vars.
          if (!isDev) {
            if (!adminLoginPassword) {
              console.error("[auth] ADMIN_LOGIN_PASSWORD is not configured");
              return null;
            }
            if (email !== adminLoginEmail || password !== adminLoginPassword) return null;
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          tenantId: user.tenantId,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, user object is present - persist to token
      if (user) {
        token.sub = user.id;
        if (hasSessionFields(user)) {
          token.tenantId = user.tenantId;
          token.role = user.role;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        if (token.sub) session.user.id = token.sub;
        if (typeof token.tenantId === "string") {
          session.user.tenantId = token.tenantId;
        }
        if (typeof token.role === "string") {
          session.user.role = token.role as Role;
        }
      }
      return session;
    },
  },

  pages: {
    signIn: "/admin/login",
    verifyRequest: "/admin/login?verify=1",
  },
});
