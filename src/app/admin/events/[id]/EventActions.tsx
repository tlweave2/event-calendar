"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { moderateEvent } from "@/lib/actions/moderate-event";
import { Button } from "@/components/ui/button";
import { EventStatus } from "@prisma/client";

export default function EventActions({
  eventId,
  currentStatus,
}: {
  eventId: string;
  currentStatus: EventStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<EventStatus | null>(null);

  const handle = async (action: "APPROVED" | "REJECTED" | "PENDING") => {
    setLoading(action);
    await moderateEvent({ eventId, action });
    router.refresh();
    setLoading(null);
  };

  return (
    <div className="flex gap-2 pt-2">
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
    </div>
  );
}