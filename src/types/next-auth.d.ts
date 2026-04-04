import { DefaultSession } from "next-auth";

type Role = "OWNER" | "ADMIN" | "EDITOR";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenantId?: string;
    role?: Role;
  }
}
