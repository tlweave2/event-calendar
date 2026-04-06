"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

function CopyBlock({ label, snippet }: { label: string; snippet: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2 rounded-lg border bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <Button size="sm" variant="outline" onClick={copy}>
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-md bg-gray-50 p-3 whitespace-pre-wrap break-all text-xs text-gray-600">
        {snippet}
      </pre>
    </div>
  );
}

export default function EmbedPageClient({
  slug,
  baseUrl,
}: {
  slug: string;
  baseUrl: string;
}) {
  const calendarUrl = `${baseUrl}/embed/${slug}/calendar`;
  const calendarOnlyUrl = `${baseUrl}/embed/${slug}/calendar?minimal=true`;
  const submitUrl = `${baseUrl}/embed/${slug}/submit`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-400">
          Hosted Pages
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Share these URLs directly - no embedding needed. Works great for email newsletters, social media, or linking from a menu.
        </p>
        <div className="space-y-3">
          <CopyBlock label="Public Calendar" snippet={calendarUrl} />
          <CopyBlock label="Calendar Only (no header)" snippet={calendarOnlyUrl} />
          <CopyBlock label="Event Submission Form" snippet={submitUrl} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-400">
          Embed on Your Website (iframe)
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Paste this HTML anywhere on your website to embed the calendar or submission form inline.
        </p>
        <div className="space-y-3">
          <CopyBlock
            label="Calendar iframe"
            snippet={`<iframe\n  src="${calendarUrl}"\n  width="100%"\n  height="700"\n  frameborder="0"\n  style="border:none; border-radius:12px;"\n></iframe>`}
          />
          <CopyBlock
            label="Calendar Only iframe (no header/logo)"
            snippet={`<iframe\n  src="${calendarOnlyUrl}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  style="border:none; border-radius:12px;"\n></iframe>`}
          />
          <CopyBlock
            label="Submission Form iframe"
            snippet={`<iframe\n  src="${submitUrl}"\n  width="100%"\n  height="900"\n  frameborder="0"\n  style="border:none; border-radius:12px;"\n></iframe>`}
          />
        </div>
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
        <p className="font-medium">Using WordPress?</p>
        <p className="mt-1 text-blue-600">
          Add an HTML block to any page or post and paste the iframe code above. Works with any page builder including Elementor, Divi, and Gutenberg.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-900">Query Parameter Overrides</p>
        <p className="mt-1 text-gray-500">
          Add these to any embed URL to override your defaults:
        </p>
        <code className="mt-2 block whitespace-pre-wrap text-xs text-gray-500">
{`?minimal=true        - Hide header/logo
&font=Poppins        - Google Font name
&view=grid           - Default to calendar grid
&hideSearch=true     - Hide search bar
&hideCategories=true - Hide category filter
&hideSubmit=true     - Hide submit link
&bg=transparent      - Background color (hex or "transparent")
&dark=true           - Dark mode`}
        </code>
      </div>
    </div>
  );
}
