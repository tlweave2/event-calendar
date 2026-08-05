import { cookies } from "next/headers";
import { encode, decode } from "next-auth/jwt";
import { safeCompare } from "@/lib/tokens";

/**
 * Operator authentication for /superadmin.
 *
 * Deliberately separate from tenant sign-in: this is you, not a customer, and
 * it must not be reachable by escalating a normal account. It is gated by
 * SUPERADMIN_SECRET, exchanged once for a short-lived signed cookie so the
 * secret is not re-sent on every request.
 */

const COOKIE_BASE = "eventful-superadmin";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function isSecure() {
  return process.env.NODE_ENV === "production";
}

export function superadminCookieName(): string {
  return isSecure() ? `__Secure-${COOKIE_BASE}` : COOKIE_BASE;
}

function getSigningSecret(): string | null {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? null;
}

export function isSuperadminConfigured(): boolean {
  return Boolean(process.env.SUPERADMIN_SECRET && getSigningSecret());
}

/** Exchange the shared secret for a session cookie. */
export async function createSuperadminSession(providedSecret: string): Promise<boolean> {
  const expected = process.env.SUPERADMIN_SECRET;
  const signingSecret = getSigningSecret();
  if (!expected || !signingSecret) return false;

  if (!safeCompare(providedSecret, expected)) return false;

  const cookieName = superadminCookieName();
  const token = await encode({
    token: { role: "superadmin", issuedAt: Date.now() },
    secret: signingSecret,
    salt: cookieName,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true,
    secure: isSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return true;
}

export async function destroySuperadminSession(): Promise<void> {
  const store = await cookies();
  store.delete(superadminCookieName());
}

export async function isSuperadmin(): Promise<boolean> {
  const signingSecret = getSigningSecret();
  if (!signingSecret) return false;

  const cookieName = superadminCookieName();
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (!token) return false;

  try {
    const payload = await decode({ token, secret: signingSecret, salt: cookieName });
    // The shared JWT type is the tenant session shape, which does not describe
    // this token; read the claim off the raw payload instead.
    const claims = payload as Record<string, unknown> | null;
    return claims?.role === "superadmin";
  } catch {
    return false;
  }
}
