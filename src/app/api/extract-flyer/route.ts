import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasFeature } from "@/lib/stripe";
import { LIMITS, consumeRateLimits, getClientIp } from "@/lib/spam-guard";

export async function POST(req: NextRequest) {
  const { image, mediaType, tenantSlug } = (await req.json()) as {
    image?: string;
    mediaType?: string;
    tenantSlug?: string;
  };

  if (!image || !mediaType) {
    return NextResponse.json({}, { status: 400 });
  }

  // Every request must be tied to a tenant whose plan includes AI flyer
  // scanning — the signed-in admin's tenant, or the public calendar's slug.
  const session = await auth();
  const tenant = session?.user?.tenantId
    ? await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { plan: true },
      })
    : tenantSlug
      ? await prisma.tenant.findUnique({
          where: { slug: tenantSlug },
          select: { plan: true },
        })
      : null;

  if (!tenant || !hasFeature(tenant.plan, "aiFlyer")) {
    return NextResponse.json(
      { error: "AI flyer scanning requires a Pro plan." },
      { status: 403 }
    );
  }

  // Each scan costs an API call, so cap anonymous use per connection.
  if (!session?.user?.tenantId) {
    const allowed = await consumeRateLimits([
      { rule: LIMITS.flyerScanPerIp, value: await getClientIp() },
    ]);
    if (!allowed) {
      return NextResponse.json({ error: "Too many scans. Please try again later." }, { status: 429 });
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({});
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
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
    return NextResponse.json({});
  }

  const data = (await response.json()) as {
    content?: Array<{ text?: string }>;
  };

  const text = data.content?.[0]?.text ?? "{}";

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(clean));
  } catch {
    return NextResponse.json({});
  }
}
