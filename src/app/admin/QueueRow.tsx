"use client";

import { useState } from "react";
import { moderateEvent } from "@/lib/actions/moderate-event";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <div
        className="flex cursor-pointer items-start justify-between px-5 py-4 hover:bg-gray-50"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="min-w-0 flex-1 space-y-1 pr-4">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-gray-900">
              {event.title}
            </span>
            {event.category && (
              <Badge variant="secondary">{event.category.name}</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {format(new Date(event.startAt), "MMM d, yyyy · h:mm a")}
            {event.locationName && ` · ${event.locationName}`}
          </p>
          <p className="text-xs text-gray-400">
            Submitted by {event.submitterName} ({event.submitterEmail})
          </p>
        </div>
        <div className="flex shrink-0 gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
            disabled={!!loading}
            onClick={() => handle("REJECTED")}
          >
            {loading === "REJECTED" ? "Rejecting…" : "Reject"}
          </Button>
          <Button
            size="sm"
            className="bg-green-600 text-white hover:bg-green-700"
            disabled={!!loading}
            onClick={() => handle("APPROVED")}
          >
            {loading === "APPROVED" ? "Approving…" : "Approve"}
          </Button>
        </div>
      </div>

      {expanded && event.description && (
        <div className="border-t bg-gray-50 px-5 py-3 text-sm text-gray-600">
          {event.description}
        </div>
      )}
    </div>
  );
}
