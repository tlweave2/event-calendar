import crypto from "crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// Anti-abuse helpers for the public, unauthenticated endpoints (event
// submission, image upload, flyer scanning). Everything is stored in our own
// database; no third-party CAPTCHA service is involved.

/** Real people take longer than this to fill in the submission form. */
const MIN_FORM_MS = 3_000;
/** Tokens older than this are rejected; the visitor just reloads the page. */
const MAX_FORM_MS = 24 * 60 * 60 * 1000;

export const HONEYPOT_FIELD = "website";

function secret(): string {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-only-spam-guard-secret";
}

function hmac(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

/**
 * Issued when the submission form is rendered. Proves the form came from our
 * page and records when, so we can reject submissions sent too quickly.
 */
export function createFormToken(tenantId: string, now = Date.now()): string {
  return `${now}.${hmac(`form:${tenantId}:${now}`)}`;
}

export type FormTokenCheck = "ok" | "invalid" | "expired" | "too_fast";

export function checkFormToken(
  token: string | undefined,
  tenantId: string,
  now = Date.now(),
): FormTokenCheck {
  if (!token) return "invalid";
  const [ts, sig] = token.split(".");
  const issuedAt = Number(ts);
  if (!Number.isFinite(issuedAt) || !sig) return "invalid";

  const expected = hmac(`form:${tenantId}:${issuedAt}`);
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return "invalid";

  const age = now - issuedAt;
  if (age < MIN_FORM_MS) return "too_fast";
  if (age > MAX_FORM_MS) return "expired";
  return "ok";
}

/** Salted hash so raw IPs and emails are never stored. */
export function hashKey(value: string): string {
  return hmac(`key:${value.trim().toLowerCase()}`).slice(0, 64);
}

/** Client IP as reported by the hosting proxy (Vercel sets x-forwarded-for). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}

export type RateLimitRule = { kind: string; limit: number; windowMs: number };

export const LIMITS = {
  submitPerIp: { kind: "submit:ip", limit: 5, windowMs: 60 * 60 * 1000 },
  submitPerEmail: { kind: "submit:email", limit: 10, windowMs: 24 * 60 * 60 * 1000 },
  uploadPerIp: { kind: "upload:ip", limit: 20, windowMs: 60 * 60 * 1000 },
  flyerScanPerIp: { kind: "flyer:ip", limit: 20, windowMs: 60 * 60 * 1000 },
} satisfies Record<string, RateLimitRule>;

/**
 * Checks every rule first, and records a hit against each only if all pass,
 * so a blocked request doesn't use up the allowance. Returns false when any
 * rule is over its limit.
 */
export async function consumeRateLimits(
  checks: { rule: RateLimitRule; value: string }[],
): Promise<boolean> {
  const now = Date.now();
  const keyed = checks.map(({ rule, value }) => ({ rule, key: hashKey(value) }));

  const counts = await Promise.all(
    keyed.map(({ rule, key }) =>
      prisma.rateLimitHit.count({
        where: { kind: rule.kind, key, createdAt: { gte: new Date(now - rule.windowMs) } },
      }),
    ),
  );
  if (counts.some((count, i) => count >= keyed[i].rule.limit)) return false;

  await prisma.rateLimitHit.createMany({
    data: keyed.map(({ rule, key }) => ({ kind: rule.kind, key })),
  });

  // Keep the table small without needing a cron job.
  if (Math.random() < 0.02) {
    prisma.rateLimitHit
      .deleteMany({ where: { createdAt: { lt: new Date(now - 24 * 60 * 60 * 1000) } } })
      .catch((err) => console.error("[spam-guard] prune failed:", err));
  }

  return true;
}
