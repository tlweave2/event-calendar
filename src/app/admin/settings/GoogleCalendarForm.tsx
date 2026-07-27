"use client";

import { useEffect, useState } from "react";
import { updateGoogleCalendar } from "@/lib/actions/update-google-calendar";
import { testGoogleCalendar } from "@/lib/actions/test-google-calendar";
import { listConnectedGoogleCalendars } from "@/lib/actions/list-google-calendars";
import { selectGoogleCalendar } from "@/lib/actions/select-google-calendar";
import { disconnectGoogleCalendar } from "@/lib/actions/disconnect-google-calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  oauthConfigured: boolean;
  connected: boolean;
  calendarId: string | null;
  calendarSummary: string | null;
  pushEnabled: boolean;
  initialIcsUrl: string;
  gcalError?: string;
  gcalConnected?: boolean;
};

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "Google Calendar sign-in isn't set up on this server yet.",
  invalid_state: "That connection attempt expired. Please try again.",
  no_refresh_token:
    "Google didn't grant offline access. Try disconnecting your Eventful access at myaccount.google.com/permissions and connecting again.",
  token_exchange_failed: "Couldn't complete the connection to Google. Please try again.",
};

export default function GoogleCalendarForm({
  oauthConfigured,
  connected,
  calendarId,
  calendarSummary,
  pushEnabled: initialPushEnabled,
  initialIcsUrl,
  gcalError,
  gcalConnected,
}: Props) {
  const [calendars, setCalendars] = useState<
    { id: string; summary: string; primary: boolean }[] | null
  >(null);
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [selectedCalendarId, setSelectedCalendarId] = useState(calendarId ?? "");
  const [pushEnabled, setPushEnabled] = useState(initialPushEnabled);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    gcalError
      ? { type: "error", text: ERROR_MESSAGES[gcalError] ?? "Something went wrong." }
      : gcalConnected
        ? { type: "success", text: "Connected! Choose a calendar below." }
        : null
  );

  const needsCalendarPicker = connected && (!calendarId || calendars !== null);

  useEffect(() => {
    if (!needsCalendarPicker || calendars !== null || loadingCalendars) return;
    setLoadingCalendars(true);
    listConnectedGoogleCalendars().then((result) => {
      setLoadingCalendars(false);
      if (result.success) {
        setCalendars(result.calendars);
        if (!selectedCalendarId && result.calendars.length > 0) {
          const primary = result.calendars.find((c) => c.primary) ?? result.calendars[0];
          setSelectedCalendarId(primary.id);
        }
      } else {
        setMessage({ type: "error", text: result.error ?? "Failed to load calendars." });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsCalendarPicker]);

  async function handleSaveCalendar() {
    if (!selectedCalendarId) return;
    setSaving(true);
    setMessage(null);
    const chosen = calendars?.find((c) => c.id === selectedCalendarId);
    const result = await selectGoogleCalendar({
      calendarId: selectedCalendarId,
      calendarSummary: chosen?.summary ?? selectedCalendarId,
      pushEnabled,
    });
    setSaving(false);
    if (result.success) {
      setMessage({ type: "success", text: "Google Calendar connected." });
      setCalendars(null);
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed to save calendar." });
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    setMessage(null);
    const result = await disconnectGoogleCalendar();
    setDisconnecting(false);
    if (result.success) {
      window.location.reload();
    } else {
      setMessage({ type: "error", text: result.error ?? "Failed to disconnect." });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Calendar</CardTitle>
        <CardDescription>
          Connect your Google account to show events from Google Calendar alongside submissions,
          and optionally push approved events straight into it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!oauthConfigured && !connected && (
          <p className="text-sm text-amber-600">
            Google sign-in isn&apos;t configured yet — use the manual .ics link below instead.
          </p>
        )}

        {oauthConfigured && !connected && (
          <a href="/api/google-calendar/connect">
            <Button type="button">Connect Google Calendar</Button>
          </a>
        )}

        {connected && (
          <div className="space-y-4">
            {calendarId && calendars === null ? (
              <div className="rounded-md border bg-gray-50 p-3 text-sm">
                <p className="font-medium text-gray-900">
                  Connected — syncing from <span className="font-mono">{calendarSummary}</span>
                </p>
                <button
                  type="button"
                  className="mt-1 text-xs text-blue-600 underline"
                  onClick={() => setCalendars(null)}
                >
                  Change calendar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Calendar to sync</Label>
                {loadingCalendars ? (
                  <p className="text-sm text-gray-500">Loading your calendars…</p>
                ) : (
                  <Select
                    value={selectedCalendarId}
                    onValueChange={(value) => setSelectedCalendarId(value ?? selectedCalendarId)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a calendar" />
                    </SelectTrigger>
                    <SelectContent>
                      {(calendars ?? []).map((cal) => (
                        <SelectItem key={cal.id} value={cal.id}>
                          {cal.summary}
                          {cal.primary ? " (primary)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Switch id="push-enabled" checked={pushEnabled} onCheckedChange={setPushEnabled} />
              <Label htmlFor="push-enabled">
                Also push approved Eventful submissions into this calendar
              </Label>
            </div>

            <div className="flex gap-2">
              <Button type="button" disabled={saving || !selectedCalendarId} onClick={handleSaveCalendar}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={disconnecting}
                onClick={handleDisconnect}
              >
                {disconnecting ? "Disconnecting…" : "Disconnect"}
              </Button>
            </div>
          </div>
        )}

        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}

        {!connected && <LegacyIcsForm initialIcsUrl={initialIcsUrl} />}
      </CardContent>
    </Card>
  );
}

function LegacyIcsForm({ initialIcsUrl }: { initialIcsUrl: string }) {
  const [open, setOpen] = useState(Boolean(initialIcsUrl));
  const [icsUrl, setIcsUrl] = useState(initialIcsUrl);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const result = await updateGoogleCalendar({ icsUrl });

    if (result.success) {
      setMessage({ type: "success", text: "Google Calendar feed saved." });
    } else {
      setMessage({ type: "error", text: result.error ?? "Something went wrong." });
    }

    setSaving(false);
  }

  async function handleTest() {
    if (!icsUrl) return;
    setTesting(true);
    setMessage(null);

    const result = await testGoogleCalendar({ icsUrl });

    if (result.success) {
      setMessage({
        type: "success",
        text: `Connection successful — found ${result.count ?? 0} event(s) in the feed.`,
      });
    } else {
      setMessage({ type: "error", text: result.error ?? "Connection failed." });
    }

    setTesting(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        className="text-xs text-gray-400 underline"
        onClick={() => setOpen(true)}
      >
        Prefer not to sign in? Use a manual .ics link instead
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
      <div className="space-y-1">
        <Label htmlFor="ics-url">Google Calendar .ics URL (read-only, no sign-in)</Label>
        <Input
          id="ics-url"
          type="url"
          placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
          value={icsUrl}
          onChange={(e) => setIcsUrl(e.target.value)}
        />
        <p className="text-xs text-gray-500">
          In Google Calendar → Settings → your calendar → &quot;Integrate calendar&quot; → copy
          the &quot;Public address in iCal format&quot; link.
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {icsUrl && (
          <Button type="button" variant="outline" disabled={testing} onClick={handleTest}>
            {testing ? "Testing…" : "Test connection"}
          </Button>
        )}
      </div>

      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
