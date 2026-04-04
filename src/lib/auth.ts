import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

type Role = "OWNER" | "ADMIN" | "EDITOR";

const isDev = process.env.NODE_ENV === "development";

function hasSessionFields(user: unknown): user is { tenantId: string; role: Role } {
  if (!user || typeof user !== "object") return false;
  const candidate = user as Record<string, unknown>;
  return typeof candidate.tenantId === "string" && typeof candidate.role === "string";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Adapter only used in production (database sessions)
  // Credentials provider requires JWT - adapter and JWT are incompatible
  ...(!isDev && { adapter: PrismaAdapter(prisma) }),

  session: {
    strategy: isDev ? "jwt" : "database",
  },

  providers: [
    ...(isDev
      ? [
          Credentials({
            name: "Dev Login",
            credentials: {
              email: { label: "Email", type: "email" },
            },
            async authorize(credentials) {
              const email = credentials?.email as string | undefined;
              if (!email) return null;

              const user = await prisma.user.findFirst({
                where: { email },
                select: {
                  id: true,
                  email: true,
                  name: true,
                  tenantId: true,
                  role: true,
                },
              });

              if (!user) {
                console.log("[dev auth] no user found for:", email);
                return null;
              }

              console.log("[dev auth] authorized:", user.email);

              return {
                id: user.id,
                email: user.email,
                name: user.name ?? undefined,
                tenantId: user.tenantId,
                role: user.role,
              };
            },
          }),
        ]
      : [
          Resend({
            apiKey: process.env.RESEND_API_KEY,
            from: "noreply@yourdomain.com",
          }),
        ]),
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
