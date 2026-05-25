"use client";

import { useState } from "react";
import { updateGoogleCalendar } from "@/lib/actions/update-google-calendar";
import { testGoogleCalendar } from "@/lib/actions/test-google-calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  initialIcsUrl: string;
};

export default function GoogleCalendarForm({ initialIcsUrl }: Props) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Calendar</CardTitle>
        <CardDescription>
          Paste the public <code className="rounded bg-gray-100 px-1 text-xs font-mono">.ics</code>{" "}
          URL for a Google Calendar you want to mirror on your public calendar. Events from this
          feed appear automatically alongside any submitted events. Leave blank to disable.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="ics-url">Google Calendar .ics URL</Label>
            <Input
              id="ics-url"
              type="url"
              placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
              value={icsUrl}
              onChange={(e) => setIcsUrl(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              In Google Calendar → Settings → your calendar → "Integrate calendar" → copy the
              "Public address in iCal format" link.
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
      </CardContent>
    </Card>
  );
}
