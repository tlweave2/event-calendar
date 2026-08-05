import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/tokens";
import { retryPendingDeliveries } from "@/lib/webhook";
import { captureError, logInfo } from "@/lib/observability";

export const dynamic = "force-dynamic";

/**
 * Retry webhook deliveries that are due.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const provided = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!safeCompare(provided, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await retryPendingDeliveries();
    logInfo("webhook retry sweep", { scope: "cron.retry-webhooks", ...result });
    return NextResponse.json(result);
  } catch (err) {
    await captureError(err, { scope: "cron.retry-webhooks" });
    return NextResponse.json({ error: "Retry sweep failed" }, { status: 500 });
  }
}
