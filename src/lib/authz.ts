import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, type Permission } from "@/lib/permissions";
import type { Role } from "@generated/prisma/enums";

/**
 * Data access layer for authentication and authorization.
 *
 * Every mutation path goes through here. Server Actions are public HTTP
 * endpoints — anyone can invoke an exported action with hand-built arguments —
 * so "the UI does not render the button" is not an access control.
 */

export { can, PERMISSIONS, type Permission } from "@/lib/permissions";

export type SessionContext = {
  userId: string;
  tenantId: string;
  role: Role;
  email: string;
};

/**
 * Resolve the caller's identity, re-reading the role from the database.
 *
 * The JWT carries a role too, but it is only refreshed at sign-in: a user
 * demoted from OWNER to EDITOR would keep owner powers until their token
 * expired. Reading the row is the authoritative check, and React `cache`
 * collapses it to one query per request.
 */
export const verifySession = cache(async (): Promise<SessionContext | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  const tenantId = session?.user?.tenantId;
  if (!userId || !tenantId) return null;

  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    select: { id: true, tenantId: true, role: true, email: true },
  });
  if (!user) return null;

  return {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
  };
});

export type AuthorizeResult =
  | { ok: true; ctx: SessionContext }
  | { ok: false; error: string; status: 401 | 403 };

/**
 * Non-throwing check for Server Actions that return `{ success, error }`.
 */
export async function authorize(permission: Permission): Promise<AuthorizeResult> {
  const ctx = await verifySession();
  if (!ctx) return { ok: false, error: "Unauthorized", status: 401 };
  if (!can(ctx.role, permission)) {
    return {
      ok: false,
      error: "You do not have permission to perform this action.",
      status: 403,
    };
  }
  return { ok: true, ctx };
}

/**
 * Page-level guard: redirects instead of returning an error. Use in Server
 * Components.
 */
export async function requirePermission(
  permission: Permission,
  redirectTo = "/admin"
): Promise<SessionContext> {
  const ctx = await verifySession();
  if (!ctx) redirect("/admin/login");
  if (!can(ctx.role, permission)) redirect(`${redirectTo}?forbidden=1`);
  return ctx;
}

/** Page-level guard requiring only a valid session. */
export async function requireSession(): Promise<SessionContext> {
  const ctx = await verifySession();
  if (!ctx) redirect("/admin/login");
  return ctx;
}
