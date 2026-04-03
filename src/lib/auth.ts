import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import authConfig from "@/lib/auth.config";

const isDev = process.env.NODE_ENV === "development";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(isDev
      ? [
          Credentials({
            name: "Dev Login",
            credentials: {
              email: { label: "Email", type: "email" },
            },
            async authorize(credentials) {
              if (!credentials?.email) return null;

              // Must already exist in users table
              const user = await prisma.user.findFirst({
                where: { email: credentials.email as string },
              });

              if (!user) return null;

              return {
                id: user.id,
                email: user.email,
                name: user.name,
              };
            },
          }),
        ]
      : []),
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: "noreply@yourdomain.com",
    }),
  ],
  skipCSRFCheck: () => isDev, // Disable CSRF for dev credentials provider
  session: {
    strategy: isDev ? "jwt" : "database",
  },
  callbacks: {
    async session({ session, token, user }) {
      // JWT path (dev credentials with JWT session)
      if (isDev && token?.sub) {
        const dbUser = await prisma.user.findFirst({
          where: { id: token.sub },
          select: { id: true, tenantId: true, role: true },
        });
        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.tenantId = dbUser.tenantId;
          session.user.role = dbUser.role;
        }
      }

      // Database session path (default: magic link or any provider)
      if (user?.email) {
        const dbUser = await prisma.user.findFirst({
          where: { email: user.email },
          select: { id: true, tenantId: true, role: true },
        });
        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.tenantId = dbUser.tenantId;
          session.user.role = dbUser.role;
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
