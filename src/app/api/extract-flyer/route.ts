import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { image, mediaType } = (await req.json()) as {
    image?: string;
    mediaType?: string;
  };

  if (!image || !mediaType) {
    return NextResponse.json({}, { status: 400 });
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
              text: `Extract event details from this flyer and return ONLY a JSON object. For the description, write 2-3 sentences describing the event based on everything visible on the flyer - even if there is no explicit description text, infer from the event name, imagery, and context. Omit any fields you cannot find or reasonably infer.
{
  "title": "event name",
  "description": "2-3 sentence description written from the flyer context",
  "startAt": "YYYY-MM-DDTHH:MM",
  "endAt": "YYYY-MM-DDTHH:MM",
  "locationName": "venue name",
  "address": "full street address",
  "cost": "price or Free",
  "ticketUrl": "registration or ticket URL"
}
Use ${new Date().getFullYear()} if no year is shown. Return only valid JSON, no explanation, no markdown.`,
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
