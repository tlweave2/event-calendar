"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { OnboardingStatus } from "@/lib/onboarding";

type Props = {
  tenantSlug: string;
  status: OnboardingStatus;
};

const STORAGE_KEY_PREFIX = "eventful:setup-checklist-dismissed:";

export default function SetupChecklist({ tenantSlug, status }: Props) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(STORAGE_KEY_PREFIX + tenantSlug) === "1");
  }, [tenantSlug]);

  if (status.complete || dismissed) return null;

  const items = [
    {
      label: "Share your calendar",
      done: status.calendarViewed,
      href: `/embed/${tenantSlug}/calendar`,
      cta: "Copy your calendar link",
    },
    {
      label: "Get your first submission",
      done: status.eventSubmitted,
      href: `/embed/${tenantSlug}/submit`,
      cta: "View submit form",
    },
    {
      label: "Approve an event",
      done: status.eventApproved,
      href: "/admin",
      cta: "Go to queue",
    },
    {
      label: "Get your first subscriber",
      done: status.hasSubscriber,
      href: `/embed/${tenantSlug}/calendar`,
      cta: "View calendar",
    },
  ];

  const doneCount = items.filter((i) => i.done).length;

  const dismiss = () => {
    window.localStorage.setItem(STORAGE_KEY_PREFIX + tenantSlug, "1");
    setDismissed(true);
  };

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-900">
            Getting started ({doneCount}/{items.length})
          </p>
          <p className="text-xs text-blue-700">A few things to do before your calendar is fully live.</p>
        </div>
        <button
          onClick={dismiss}
          className="text-xs text-blue-500 hover:text-blue-700"
          aria-label="Dismiss checklist"
        >
          Dismiss
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <span className={`flex items-center gap-2 ${item.done ? "text-blue-400 line-through" : "text-blue-900"}`}>
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                  item.done ? "bg-blue-500 text-white" : "border border-blue-300"
                }`}
              >
                {item.done ? "✓" : ""}
              </span>
              {item.label}
            </span>
            {!item.done && (
              <Link href={item.href} target="_blank" className="shrink-0 text-xs font-medium text-blue-600 underline">
                {item.cta}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
