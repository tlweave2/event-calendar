"use client";

import dynamic from "next/dynamic";

const GoogleCalendarForm = dynamic(() => import("./GoogleCalendarForm"), { ssr: false });
const WebhookSettingsForm = dynamic(() => import("./WebhookSettingsForm"), { ssr: false });

export function GoogleCalendarFormClient({ initialIcsUrl }: { initialIcsUrl: string }) {
  return <GoogleCalendarForm initialIcsUrl={initialIcsUrl} />;
}

export function WebhookSettingsFormClient({
  initialUrl,
  initialEnabled,
}: {
  initialUrl: string;
  initialEnabled: boolean;
}) {
  return <WebhookSettingsForm initialUrl={initialUrl} initialEnabled={initialEnabled} />;
}
