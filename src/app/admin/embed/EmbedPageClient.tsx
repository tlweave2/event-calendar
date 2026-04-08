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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="shrink-0 rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
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

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
        <p className="mb-1 font-medium text-gray-900">Query Parameter Overrides</p>
        <p className="mb-4 text-gray-500">
          Append these to any embed URL to customize the look without changing your saved defaults.
          You can combine multiple parameters together.
        </p>

        <div className="space-y-3">
          {[
            {
              param: "?minimal=true",
              desc: "Hide the header and logo - great for tight embeds",
              example: `/embed/${slug}/calendar?minimal=true`,
            },
            {
              param: "&font=Poppins",
              desc: "Use any Google Font by name",
              example: `/embed/${slug}/calendar?font=Poppins`,
            },
            {
              param: "&view=grid",
              desc: "Default to the calendar grid instead of list view",
              example: `/embed/${slug}/calendar?view=grid`,
            },
            {
              param: "&style=compact",
              desc: "Calendar style: modern, compact, image, or minimal",
              example: `/embed/${slug}/calendar?style=compact`,
            },
            {
              param: "&dark=true",
              desc: "Enable dark mode - useful for dark-themed websites",
              example: `/embed/${slug}/calendar?dark=true`,
            },
            {
              param: "&bg=transparent",
              desc: "Transparent background so it blends into your site",
              example: `/embed/${slug}/calendar?bg=transparent`,
            },
            {
              param: "&bg=%23ff0000",
              desc: "Custom background color (use %23 instead of # in URLs)",
              example: `/embed/${slug}/calendar?bg=%23f3f4f6`,
            },
            {
              param: "&hideSearch=true",
              desc: "Hide the search bar",
              example: `/embed/${slug}/calendar?hideSearch=true`,
            },
            {
              param: "&hideCategories=true",
              desc: "Hide the category filter",
              example: `/embed/${slug}/calendar?hideCategories=true`,
            },
            {
              param: "&hideSubmit=true",
              desc: "Hide the submit an event link",
              example: `/embed/${slug}/calendar?hideSubmit=true`,
            },
            {
              param: "&flyers=true",
              desc: "Show or hide the flyer gallery strip at the bottom",
              example: `/embed/${slug}/calendar?flyers=true`,
            },
          ].map(({ param, desc, example }) => (
            <div key={param} className="space-y-1 rounded-md border bg-white p-3">
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono font-semibold text-violet-600">{param}</code>
                <span className="text-xs text-gray-500">{desc}</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-gray-50 px-2 py-1 text-xs text-gray-500">
                  {baseUrl}{example}
                </code>
                <CopyButton text={`${baseUrl}${example}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1 rounded-md border bg-white p-3">
          <p className="text-xs font-medium text-gray-700">Combining multiple params</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-gray-50 px-2 py-1 text-xs text-gray-500">
              {baseUrl}/embed/{slug}/calendar?minimal=true&dark=true&font=Inter&hideSubmit=true
            </code>
            <CopyButton text={`${baseUrl}/embed/${slug}/calendar?minimal=true&dark=true&font=Inter&hideSubmit=true`} />
          </div>
        </div>
      </div>
    </div>
  );
}
