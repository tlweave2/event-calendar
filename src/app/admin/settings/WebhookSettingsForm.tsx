"use client";

import { useState, useEffect } from "react";
import { updateWebhookConfig, generateWebhookSecret } from "@/lib/actions/update-webhook-config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

type Props = {
  initialUrl: string;
  initialEnabled: boolean;
};

export default function WebhookSettingsForm({ initialUrl, initialEnabled }: Props) {
  const [url, setUrl] = useState(initialUrl);
  const [secret, setSecret] = useState("");
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // Generate a default secret on first mount if no existing webhook
    if (!initialUrl) {
      generateWebhookSecret().then(setSecret);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const result = await updateWebhookConfig({ url, secret, enabled });

    if (result.success) {
      setMessage({ type: "success", text: "Webhook configuration saved." });
    } else {
      setMessage({ type: "error", text: result.error ?? "Something went wrong." });
    }

    setSaving(false);
  }

  async function handleGenerate() {
    const newSecret = await generateWebhookSecret();
    setSecret(newSecret);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook</CardTitle>
        <CardDescription>
          Send real-time event notifications to an external endpoint.
          Eventful will POST a JSON payload with the signature header{" "}
          <code className="rounded bg-gray-100 px-1 text-xs font-mono">X-Webhook-Signature</code>{" "}
          (HMAC-SHA256 of the body using your secret).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL */}
          <div className="space-y-1">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://hubs.example.com/webhooks/eventful"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          {/* Secret */}
          <div className="space-y-1">
            <Label htmlFor="webhook-secret">Secret</Label>
            <div className="flex gap-2">
              <Input
                id="webhook-secret"
                type="text"
                placeholder="At least 16 characters"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
                minLength={16}
                className="font-mono"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleGenerate}>
                Generate
              </Button>
            </div>
          </div>

          {/* Enabled */}
          <div className="flex items-center gap-3">
            <Switch id="webhook-enabled" checked={enabled} onCheckedChange={setEnabled} />
            <Label htmlFor="webhook-enabled">Webhook enabled</Label>
          </div>

          {/* Submit */}
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save webhook"}
          </Button>

          {/* Feedback */}
          {message && (
            <p
              className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}
            >
              {message.text}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}