"use client";

import { useState } from "react";
import { moderateEvent } from "@/lib/actions/moderate-event";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type Event = {
  id: string;
  title: string;
  startAt: Date;
  locationName: string | null;
  submitterName: string | null;
  submitterEmail: string | null;
  description: string | null;
  category: { name: string; color: string | null } | null;
};

export default function QueueRow({ event }: { event: Event }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [done, setDone] = useState(false);

  if (done) return null;

  const handle = async (action: "APPROVED" | "REJECTED") => {
    setLoading(action);
    await moderateEvent({ eventId: event.id, action });
    setDone(true);
  };

  const start = new Date(event.startAt);

  return (
    <li className="border-b border-gray-200 last:border-b-0">
      <div className="grid grid-cols-[3.25rem_1fr] gap-4 px-5 py-4 sm:grid-cols-[3.25rem_1fr_auto]">
        <div className="text-center leading-none">
          <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-gray-500">
            {format(start, "EEE")}
          </div>
          <div className="mt-1 text-2xl font-semibold" style={{ fontFamily: "var(--app-serif)" }}>
            {format(start, "d")}
          </div>
          <div className="mt-1 text-[0.65rem] uppercase tracking-wider text-gray-500">
            {format(start, "MMM")}
          </div>
        </div>

        <div className="min-w-0">
          <button
            type="button"
            className="text-left font-medium text-gray-900 hover:underline disabled:no-underline"
            onClick={() => setExpanded((v) => !v)}
            disabled={!event.description}
            aria-expanded={expanded}
          >
            {event.title}
          </button>
          <p className="mt-0.5 text-sm text-gray-600">
            {format(start, "h:mm a")}
            {event.locationName && ` · ${event.locationName}`}
            {event.category && ` · ${event.category.name}`}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            From {event.submitterName || "unknown"}
            {event.submitterEmail && (
              <>
                {" "}
                <a href={`mailto:${event.submitterEmail}`} className="underline underline-offset-2 hover:text-gray-900">
                  {event.submitterEmail}
                </a>
              </>
            )}
          </p>
          {expanded && event.description && (
            <p className="mt-3 max-w-prose whitespace-pre-line border-l-2 border-gray-300 pl-3 text-sm text-gray-700">
              {event.description}
            </p>
          )}
        </div>

        <div className="col-start-2 flex gap-2 sm:col-start-3 sm:items-start">
          <Button
            size="sm"
            variant="outline"
            disabled={!!loading}
            onClick={() => handle("REJECTED")}
          >
            {loading === "REJECTED" ? "Rejecting…" : "Reject"}
          </Button>
          <Button size="sm" disabled={!!loading} onClick={() => handle("APPROVED")}>
            {loading === "APPROVED" ? "Approving…" : "Approve"}
          </Button>
        </div>
      </div>
    </li>
  );
}
