"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { moderateEvent } from "@/lib/actions/moderate-event";
import { deleteEvent } from "@/lib/actions/delete-event";
import { Button } from "@/components/ui/button";

type EventStatus = "PENDING" | "APPROVED" | "REJECTED";

export default function EventActions({
  eventId,
  currentStatus,
  seriesId,
  seriesIndex,
}: {
  eventId: string;
  currentStatus: EventStatus;
  seriesId: string | null;
  seriesIndex: number | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<EventStatus | "DELETING" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteScope, setDeleteScope] = useState<"one" | "following" | "all">("one");

  const handle = async (action: "APPROVED" | "REJECTED" | "PENDING") => {
    setLoading(action);
    await moderateEvent({ eventId, action });
    router.refresh();
    setLoading(null);
  };

  const handleDelete = async (scope: "one" | "following" | "all" = "one") => {
    setLoading("DELETING");
    await deleteEvent(eventId, scope);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      {currentStatus !== "APPROVED" && (
        <Button
          className="bg-green-600 text-white hover:bg-green-700"
          disabled={!!loading}
          onClick={() => handle("APPROVED")}
        >
          {loading === "APPROVED" ? "Approving..." : "Approve"}
        </Button>
      )}

      {currentStatus !== "REJECTED" && (
        <Button
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50"
          disabled={!!loading}
          onClick={() => handle("REJECTED")}
        >
          {loading === "REJECTED" ? "Rejecting..." : "Reject"}
        </Button>
      )}

      {currentStatus !== "PENDING" && (
        <Button
          variant="ghost"
          className="text-gray-500"
          disabled={!!loading}
          onClick={() => handle("PENDING")}
        >
          {loading === "PENDING" ? "Resetting..." : "Reset to Pending"}
        </Button>
      )}

      <div className="ml-auto">
        {!confirmDelete ? (
          <Button
            variant="ghost"
            className="text-red-400 hover:text-red-600"
            disabled={!!loading}
            onClick={() => setConfirmDelete(true)}
          >
            Delete event
          </Button>
        ) : (
          <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3">
            {seriesId && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-red-700">
                  Delete from series{seriesIndex ? ` (#${seriesIndex})` : ""}:
                </p>
                {(["one", "following", "all"] as const).map((scope) => (
                  <label key={scope} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="deleteScope"
                      value={scope}
                      checked={deleteScope === scope}
                      onChange={() => setDeleteScope(scope)}
                    />
                    <span className="text-xs text-red-700">
                      {scope === "one" && "Just this event"}
                      {scope === "following" && "This and following events"}
                      {scope === "all" && "All events in series"}
                    </span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600">Are you sure?</span>
              <button
                className="text-xs font-medium text-red-600 underline hover:text-red-800"
                disabled={!!loading}
                onClick={() => handleDelete(deleteScope)}
              >
                {loading === "DELETING" ? "Deleting..." : "Yes, delete"}
              </button>
              <button
                className="text-xs text-gray-400 hover:text-gray-600"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}