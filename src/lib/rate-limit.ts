import { prisma } from "@/lib/prisma";

/**
 * Fixed-window rate limiting backed by Postgres.
 *
 * The counter lives in the database rather than in process memory because the
 * app runs on serverless instances — an in-memory map would hand every cold
 * instance a fresh full quota, which is no limit at all.
 */

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Seconds until the current window resets. */
  retryAfterSeconds: number;
};

type CounterRow = { count: number; expiresAt: Date };

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const rows = await prisma.$queryRaw<CounterRow[]>`
      INSERT INTO "rate_limits" ("key", "count", "expiresAt")
      VALUES (${key}, 1, NOW() + make_interval(secs => ${windowSeconds}::int))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "rate_limits"."expiresAt" <= NOW() THEN 1
          ELSE "rate_limits"."count" + 1
        END,
        "expiresAt" = CASE
          WHEN "rate_limits"."expiresAt" <= NOW() THEN EXCLUDED."expiresAt"
          ELSE "rate_limits"."expiresAt"
        END
      RETURNING "count", "expiresAt"
    `;

    const row = rows[0];
    if (!row) return allow(limit, windowSeconds);

    const count = Number(row.count);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((row.expiresAt.getTime() - Date.now()) / 1000)
    );

    // Opportunistic garbage collection of expired windows.
    if (Math.random() < 0.01) void sweepExpired();

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds,
    };
  } catch (err) {
    // A limiter that hard-fails takes the whole endpoint down with it. If the
    // database is unreachable the request is going to fail on its own merits
    // anyway, so let it through and make the failure loud in the logs.
    console.error("[rate-limit] check failed, allowing request:", err);
    return allow(limit, windowSeconds);
  }
}

function allow(limit: number, windowSeconds: number): RateLimitResult {
  return { allowed: true, remaining: limit - 1, retryAfterSeconds: windowSeconds };
}

async function sweepExpired() {
  try {
    await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  } catch (err) {
    console.error("[rate-limit] sweep failed:", err);
  }
}

/**
 * Best-effort client IP. Behind Vercel/Cloudflare the left-most
 * x-forwarded-for entry is the real client; fall back to a constant so a
 * missing header shares one bucket rather than bypassing the limit entirely.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** 429 response with a Retry-After header, for route handlers. */
export function tooManyRequests(result: RateLimitResult, message?: string): Response {
  return new Response(
    JSON.stringify({ error: message ?? "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds),
      },
    }
  );
}
