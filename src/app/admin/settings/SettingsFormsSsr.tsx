"use client";

import dynamic from "next/dynamic";

const GoogleCalendarForm = dynamic(() => import("./GoogleCalendarForm"), { ssr: false });
const WebhookSettingsForm = dynamic(() => import("./WebhookSettingsForm"), { ssr: false });

type GoogleCalendarFormClientProps = {
  oauthConfigured: boolean;
  connected: boolean;
  calendarId: string | null;
  calendarSummary: string | null;
  pushEnabled: boolean;
  initialIcsUrl: string;
  gcalError?: string;
  gcalConnected?: boolean;
};

export function GoogleCalendarFormClient(props: GoogleCalendarFormClientProps) {
  return <GoogleCalendarForm {...props} />;
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
