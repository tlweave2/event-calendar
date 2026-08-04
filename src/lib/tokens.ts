import crypto from "node:crypto";

/**
 * Single-use tokens (invites, password resets, email verification).
 *
 * Only the SHA-256 hash is stored. The raw token goes out in the email and is
 * never persisted, so a leaked database dump cannot be replayed to take over
 * an account.
 */

export function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Constant-time string comparison for shared secrets. */
export function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

// ─── VerificationToken identifiers ─────────────────────────────────────────
// The NextAuth verification_tokens table is shared by all three flows. The
// identifier column encodes which flow a token belongs to, so a password
// reset token can never be redeemed as an invite (or vice versa).

export const TOKEN_TTL = {
  invite: 1000 * 60 * 60 * 24 * 7, // 7 days
  passwordReset: 1000 * 60 * 60, // 1 hour
  emailVerification: 1000 * 60 * 60 * 24, // 24 hours
} as const;

export function inviteIdentifier(tenantId: string, email: string, role: string): string {
  return `invite:${tenantId}:${email}:${role}`;
}

export function parseInviteIdentifier(
  identifier: string
): { tenantId: string; email: string; role: string } | null {
  const parts = identifier.split(":");
  if (parts.length < 4 || parts[0] !== "invite") return null;
  const tenantId = parts[1];
  const role = parts[parts.length - 1];
  // Rejoin the middle segments so an address containing a colon survives.
  const email = parts.slice(2, -1).join(":");
  if (!tenantId || !email || !role) return null;
  return { tenantId, email, role };
}

export function passwordResetIdentifier(userId: string): string {
  return `pwreset:${userId}`;
}

export function parsePasswordResetIdentifier(identifier: string): string | null {
  const parts = identifier.split(":");
  if (parts.length !== 2 || parts[0] !== "pwreset" || !parts[1]) return null;
  return parts[1];
}

export function emailVerificationIdentifier(userId: string): string {
  return `verify:${userId}`;
}

export function parseEmailVerificationIdentifier(identifier: string): string | null {
  const parts = identifier.split(":");
  if (parts.length !== 2 || parts[0] !== "verify" || !parts[1]) return null;
  return parts[1];
}
