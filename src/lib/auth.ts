import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { Role } from "@generated/prisma/enums";

/**
 * Email verification is opt-in so that a deployment without a configured mail
 * provider cannot lock every user out of its own dashboard.
 */
const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === "true";

const LOGIN_ATTEMPTS_PER_WINDOW = 10;
const LOGIN_WINDOW_SECONDS = 15 * 60;

/**
 * How many accounts sharing one address we are willing to bcrypt-check. The
 * same person can hold accounts in several tenants; the cap stops a shared
 * address from turning one login into an unbounded amount of hashing work.
 */
const MAX_LOGIN_CANDIDATES = 5;

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
      name: "Sign In",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = (credentials?.email as string | undefined)?.toLowerCase().trim();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        // Throttle by address and by source IP: the first stops credential
        // stuffing against one account, the second stops one host from
        // sweeping many accounts.
        const ip = request?.headers ? getClientIp(request.headers) : "unknown";
        const [byEmail, byIp] = await Promise.all([
          rateLimit(`login:email:${email}`, LOGIN_ATTEMPTS_PER_WINDOW, LOGIN_WINDOW_SECONDS),
          rateLimit(`login:ip:${ip}`, LOGIN_ATTEMPTS_PER_WINDOW * 5, LOGIN_WINDOW_SECONDS),
        ]);
        if (!byEmail.allowed || !byIp.allowed) {
          console.warn("[auth] login rate limit exceeded for:", email);
          return null;
        }

        // Only accounts that have completed password setup can sign in. An
        // invited user with no password must redeem their invite first.
        const candidates = await prisma.user.findMany({
          where: { email, password: { not: null } },
          select: {
            id: true,
            email: true,
            name: true,
            tenantId: true,
            role: true,
            password: true,
            emailVerifiedAt: true,
          },
          // Stable ordering so a repeated login always lands in the same
          // tenant when one address exists in several.
          orderBy: { createdAt: "asc" },
          take: MAX_LOGIN_CANDIDATES,
        });

        for (const user of candidates) {
          if (!user.password) continue;
          const valid = await bcrypt.compare(password, user.password);
          if (!valid) continue;

          if (requireEmailVerification && !user.emailVerifiedAt) {
            console.warn("[auth] unverified email attempted login:", email);
            return null;
          }

          await prisma.user
            .update({ where: { id: user.id }, data: { lastLogin: new Date() } })
            .catch((err) => console.error("[auth] lastLogin update failed:", err));

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            tenantId: user.tenantId,
            role: user.role,
          };
        }

        return null;
      },
    }),
  ],

  callbacks: {
    async redirect({ url, baseUrl }) {
      // Only allow redirects to this app's own origin.
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        return `${baseUrl}/admin`;
      }
      return `${baseUrl}/admin`;
    },

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
