"use client";

import { useMemo, useState } from "react";
import { format, isToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

type Category = { id: string; name: string; color: string | null };

type Event = {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  locationName: string | null;
  address: string | null;
  ticketUrl: string | null;
  cost: string | null;
  imageUrl: string | null;
  category: Category | null;
};

export default function CalendarView({
  events,
  categories,
  primaryColor,
  tenantSlug,
}: {
  events: Event[];
  categories: Category[];
  primaryColor: string | null;
  tenantSlug: string;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchesSearch =
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.description?.toLowerCase().includes(search.toLowerCase()) ||
        e.locationName?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || e.category?.id === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [events, search, categoryFilter]);

  const accent = primaryColor ?? "#2563eb";

  if (events.length === 0) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p className="text-lg">No upcoming events</p>
        <a
          href={`/embed/${tenantSlug}/submit`}
          className="mt-4 inline-block text-sm underline"
          style={{ color: accent }}
        >
          Submit an event
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs bg-white"
        />

        {categories.length > 0 && (
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value ?? "all")}
          >
            <SelectTrigger className="w-44 bg-white">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <a
          href={`/embed/${tenantSlug}/submit`}
          className="ml-auto self-center text-sm font-medium underline"
          style={{ color: accent }}
        >
          + Submit an Event
        </a>
      </div>

      {search || categoryFilter !== "all" ? (
        <p className="text-sm text-gray-500">
          {filtered.length} event{filtered.length !== 1 ? "s" : ""} found
        </p>
      ) : null}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-gray-400">
            No events match your search.
          </p>
        ) : (
          filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              expanded={expandedId === event.id}
              onToggle={() =>
                setExpandedId(expandedId === event.id ? null : event.id)
              }
              accent={accent}
            />
          ))
        )}
      </div>
    </div>
  );
}

function EventCard({
  event,
  expanded,
  onToggle,
  accent,
}: {
  event: Event;
  expanded: boolean;
  onToggle: () => void;
  accent: string;
}) {
  const isHappeningToday = isToday(new Date(event.startAt));

  return (
    <Card
      className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
      onClick={onToggle}
    >
      <CardContent className="p-0">
        <div className="flex">
          <div
            className="flex w-20 shrink-0 flex-col items-center justify-center py-4 text-white"
            style={{ backgroundColor: accent }}
          >
            <span className="text-xs font-medium uppercase opacity-80">
              {format(new Date(event.startAt), "MMM")}
            </span>
            <span className="text-2xl font-bold leading-none">
              {format(new Date(event.startAt), "d")}
            </span>
            <span className="text-xs opacity-80">
              {format(new Date(event.startAt), "EEE")}
            </span>
          </div>

          <div className="min-w-0 flex-1 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-medium text-gray-900">{event.title}</h3>
                  {isHappeningToday && (
                    <Badge className="bg-green-100 text-xs text-green-700">
                      Today
                    </Badge>
                  )}
                  {event.category && (
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={
                        event.category.color
                          ? {
                              backgroundColor: `${event.category.color}22`,
                              color: event.category.color,
                            }
                          : {}
                      }
                    >
                      {event.category.name}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-gray-500">
                  {format(new Date(event.startAt), "h:mm a")}
                  {event.endAt &&
                    ` - ${format(new Date(event.endAt), "h:mm a")}`}
                  {event.locationName && ` · ${event.locationName}`}
                </p>
                {event.cost && (
                  <p className="mt-0.5 text-xs text-gray-400">{event.cost}</p>
                )}
              </div>
            </div>

            {expanded && (
              <div
                className="mt-3 space-y-2 border-t pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                {event.description && (
                  <p className="text-sm text-gray-600">{event.description}</p>
                )}
                {event.address && (
                  <p className="text-sm text-gray-500">{`Location: ${event.address}`}</p>
                )}
                {event.ticketUrl && (
                  <a
                    href={event.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm font-medium underline"
                    style={{ color: accent }}
                  >
                    Tickets / Register {">"}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}