import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMergedApprovedEvents } from "@/lib/merged-events";
import { sendDigestEmail } from "@/lib/email";

const DIGEST_WINDOW_DAYS = 7;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://www.useventful.com";
  const now = new Date();
  const windowEnd = new Date(now.getTime() + DIGEST_WINDOW_DAYS * 86_400_000);

  const tenants = await prisma.tenant.findMany({
    where: { subscribers: { some: {} } },
    include: { subscribers: true },
  });

  let tenantsProcessed = 0;
  let emailsSent = 0;

  for (const tenant of tenants) {
    try {
      const allEvents = await getMergedApprovedEvents(tenant);
      const upcoming = allEvents
        .filter((ev) => ev.startAt >= now && ev.startAt <= windowEnd)
        .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
        .slice(0, 20);

      if (upcoming.length === 0) continue;

      tenantsProcessed++;
      const calendarUrl = `${baseUrl}/embed/${tenant.slug}/calendar`;

      for (const subscriber of tenant.subscribers) {
        try {
          await sendDigestEmail({
            to: subscriber.email,
            tenantName: tenant.name,
            calendarUrl,
            unsubscribeUrl: `${baseUrl}/api/subscribers/unsubscribe?token=${subscriber.unsubscribeToken}`,
            events: upcoming.map((ev) => ({
              title: ev.title,
              startAt: ev.startAt,
              locationName: ev.locationName,
            })),
          });
          emailsSent++;
        } catch (err) {
          console.error(`[digest] failed to send to ${subscriber.email}:`, err);
        }
      }
    } catch (err) {
      console.error(`[digest] failed to process tenant ${tenant.slug}:`, err);
    }
  }

  return NextResponse.json({ tenantsProcessed, emailsSent });
}
