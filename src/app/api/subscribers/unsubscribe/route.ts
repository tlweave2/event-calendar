import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function htmlPage(message: string) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Eventful</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;color:#111}p{max-width:360px;text-align:center;padding:0 1rem}</style>
</head><body><p>${message}</p></body></html>`;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return new NextResponse(htmlPage("Missing unsubscribe link."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const subscriber = await prisma.subscriber.findUnique({ where: { unsubscribeToken: token } });
  if (!subscriber) {
    return new NextResponse(htmlPage("You're already unsubscribed."), {
      headers: { "Content-Type": "text/html" },
    });
  }

  await prisma.subscriber.delete({ where: { id: subscriber.id } });

  return new NextResponse(htmlPage("You've been unsubscribed from this calendar's updates."), {
    headers: { "Content-Type": "text/html" },
  });
}
