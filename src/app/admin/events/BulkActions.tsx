"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { bulkModerateEvents } from "@/lib/actions/bulk-moderate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type EventRow = {
  id: string;
  title: string;
  startAt: string | Date;
  category: { name: string } | null;
  submitterName: string | null;
  submitterEmail: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export default function BulkActions({ events }: { events: EventRow[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCount = selected.length;
  const allSelected = events.length > 0 && selectedCount === events.length;

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggleAll = () => {
    setSelected(allSelected ? [] : events.map((event) => event.id));
  };

  const toggleOne = (eventId: string) => {
    setSelected((current) =>
      current.includes(eventId)
        ? current.filter((id) => id !== eventId)
        : [...current, eventId]
    );
  };

  const runAction = (action: "APPROVED" | "REJECTED" | "PENDING") => {
    if (selected.length === 0) return;

    setMessage(null);
    startTransition(async () => {
      const result = await bulkModerateEvents({ eventIds: selected, action });
      if (!result.success) {
        setMessage(result.error ?? "Bulk moderation failed.");
        return;
      }

      setSelected([]);
      setMessage(`Updated ${result.updatedCount} event${result.updatedCount === 1 ? "" : "s"}.`);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3">
        <div className="text-sm text-gray-500">
          {selectedCount === 0 ? "Select events to moderate." : `${selectedCount} selected`}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={toggleAll} disabled={events.length === 0}>
            {allSelected ? "Clear selection" : "Select all"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => runAction("PENDING")} disabled={isPending || selectedCount === 0}>
            Mark pending
          </Button>
          <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => runAction("APPROVED")} disabled={isPending || selectedCount === 0}>
            Approve selected
          </Button>
          <Button size="sm" variant="destructive" onClick={() => runAction("REJECTED")} disabled={isPending || selectedCount === 0}>
            Reject selected
          </Button>
        </div>
      </div>

      {message && <p className="text-sm text-gray-500">{message}</p>}

      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 px-4">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            </TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Submitted by</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id} data-state={selectedSet.has(event.id) ? "selected" : undefined}>
              <TableCell className="align-top">
                <input type="checkbox" checked={selectedSet.has(event.id)} onChange={() => toggleOne(event.id)} />
              </TableCell>
              <TableCell className="max-w-xs truncate font-medium text-gray-900">
                <Link href={`/admin/events/${event.id}`} className="hover:underline">
                  {event.title}
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap text-gray-500">
                {format(new Date(event.startAt), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-gray-500">
                {event.category?.name ?? <span className="text-gray-300">-</span>}
              </TableCell>
              <TableCell className="max-w-xs truncate text-gray-500">
                {event.submitterName ?? "-"}
                {event.submitterEmail && <span className="ml-1 text-gray-400">({event.submitterEmail})</span>}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{event.status.charAt(0) + event.status.slice(1).toLowerCase()}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}