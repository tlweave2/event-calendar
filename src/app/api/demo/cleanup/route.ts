import { NextResponse } from "next/server";
import { deleteExpiredDemos } from "@/lib/demo-cleanup";

// Called daily by the Vercel cron in vercel.json. When CRON_SECRET is set,
// Vercel sends it as a Bearer token and anything else is refused.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await deleteExpiredDemos();
  return NextResponse.json({ deleted });
}
