import type { Role } from "@generated/prisma/enums";

/**
 * Pure role/permission logic, with no database or session imports.
 *
 * Kept separate from `authz.ts` so client components can decide what to render
 * without pulling Prisma and NextAuth into the browser bundle. This is for
 * display only — the server-side guards in `authz.ts` are the real check.
 */

const ROLE_RANK: Record<Role, number> = {
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3,
};

/** Minimum role required for each permission. */
export const PERMISSIONS = {
  "events:write": "EDITOR",
  "events:moderate": "EDITOR",
  "events:delete": "ADMIN",
  "events:export": "ADMIN",
  "settings:write": "ADMIN",
  "billing:manage": "OWNER",
  "users:manage": "OWNER",
} as const satisfies Record<string, Role>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[PERMISSIONS[permission]];
}
