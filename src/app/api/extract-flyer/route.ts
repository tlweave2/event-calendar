import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession, can } from "@/lib/authz";
import { hasFeature } from "@/lib/stripe";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

/** Base64 payload ceiling — roughly a 7MB image once decoded. */
const MAX_IMAGE_CHARS = 10 * 1024 * 1024;

const ADMIN_EXTRACTS_PER_HOUR = 60;
const PUBLIC_EXTRACTS_PER_HOUR = 10;

const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Flyer extraction calls the Anthropic API on our key, so every request costs
 * money. The plan check used to be skipped entirely when the caller omitted
 * `tenantSlug`, which made the whole endpoint free to anyone who left the
 * field out.
 */
export async function POST(req: NextRequest) {
  let payload: { image?: string; mediaType?: string; tenantSlug?: string };
  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { image, mediaType, tenantSlug } = payload;

  if (!image || !mediaType) {
    return NextResponse.json({ error: "Missing image or mediaType" }, { status: 400 });
  }

  if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }

  if (image.length > MAX_IMAGE_CHARS) {
    return NextResponse.json({ error: "Image is too large" }, { status: 413 });
  }

  const scope = await resolveScope(req, tenantSlug);
  if (!scope.ok) {
    return NextResponse.json({ error: scope.error }, { status: scope.status });
  }

  const limit = await rateLimit(scope.rateLimitKey, scope.perHour, 60 * 60);
  if (!limit.allowed) return tooManyRequests(limit);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Flyer scanning is not configured." },
      { status: 503 }
    );
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: image },
            },
            {
              type: "text",
              text: `You are helping someone submit a community event to a public calendar. Analyze this event flyer carefully and extract all visible information.

For the description, write 3-4 sentences that would make someone want to attend. Include:
- What specifically happens at the event (activities, entertainment, performers if named)
- Who it is for (families, car enthusiasts, music lovers, etc.)
- Any special details visible on the flyer (food, vendors, contests, prizes, free admission, sponsors)
- The overall vibe/atmosphere

Do NOT just restate the event title. Do NOT use generic filler phrases like "community event" or "enthusiasts and families to enjoy." Be specific to what is actually on this flyer.

Return ONLY a JSON object, no explanation, no markdown:
{
  "title": "event name",
  "description": "specific 3-4 sentence description as described above",
  "startAt": "YYYY-MM-DDTHH:MM",
  "endAt": "YYYY-MM-DDTHH:MM",
  "locationName": "venue name",
  "address": "full street address",
  "cost": "price or Free",
  "ticketUrl": "registration or ticket URL"
}
Use ${new Date().getFullYear()} if no year is shown. Return only valid JSON.`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error("[extract-flyer] anthropic request failed:", response.status);
    return NextResponse.json({});
  }

  const data = (await response.json()) as { content?: Array<{ text?: string }> };
  const text = data.content?.[0]?.text ?? "{}";

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(clean));
  } catch {
    return NextResponse.json({});
  }
}

type Scope =
  | { ok: true; rateLimitKey: string; perHour: number }
  | { ok: false; error: string; status: number };

async function resolveScope(
  req: NextRequest,
  tenantSlug: string | undefined
): Promise<Scope> {
  const ctx = await verifySession();

  // Signed-in team member: the plan is read from their own tenant, never from
  // a slug supplied by the caller.
  if (ctx && can(ctx.role, "events:write")) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: { plan: true },
    });
    if (!tenant || !hasFeature(tenant.plan, "aiFlyer")) {
      return {
        ok: false,
        error: "AI flyer scanning requires a Pro plan.",
        status: 403,
      };
    }
    return {
      ok: true,
      rateLimitKey: `extract:admin:${ctx.tenantId}`,
      perHour: ADMIN_EXTRACTS_PER_HOUR,
    };
  }

  // Anonymous submitter on a public form. The slug is required — there is no
  // unauthenticated path that skips the plan check.
  if (!tenantSlug) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, plan: true },
  });
  if (!tenant) {
    return { ok: false, error: "Unknown calendar", status: 404 };
  }
  if (!hasFeature(tenant.plan, "aiFlyer")) {
    return { ok: false, error: "AI flyer scanning requires a Pro plan.", status: 403 };
  }

  return {
    ok: true,
    // Bounded per calendar and per visitor, so one tenant's public form cannot
    // be used to run up an unbounded bill.
    rateLimitKey: `extract:public:${tenant.id}:${getClientIp(req.headers)}`,
    perHour: PUBLIC_EXTRACTS_PER_HOUR,
  };
}
