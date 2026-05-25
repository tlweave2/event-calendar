"use client";

import { useState } from "react";
import { format, isToday, isTomorrow } from "date-fns";
import { formatCost } from "@/lib/format";

type CalendarEvent = {
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
  category: { id: string; name: string; color: string | null } | null;
};

function dayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE, MMMM d");
}

export default function EventsList({
  events,
  primaryColor,
  darkMode = false,
}: {
  events: CalendarEvent[];
  primaryColor: string | null;
  darkMode?: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const accent = primaryColor ?? "#2563eb";

  if (events.length === 0) {
    return (
      <p className={`py-12 text-center text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
        No upcoming events
      </p>
    );
  }

  // Group by calendar date
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = format(new Date(event.startAt), "yyyy-MM-dd");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(event);
  }

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([dateKey, dayEvents]) => (
        <div key={dateKey}>
          <div
            className="mb-2 border-b pb-1 text-xs font-semibold uppercase tracking-widest"
            style={{ color: accent, borderColor: `${accent}33` }}
          >
            {dayLabel(new Date(dateKey))}
          </div>

          <div className="space-y-2">
            {dayEvents.map((event) => {
              const expanded = expandedId === event.id;
              return (
                <div
                  key={event.id}
                  className={`cursor-pointer rounded-lg border px-4 py-3 transition-shadow hover:shadow-sm ${
                    darkMode ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white"
                  }`}
                  onClick={() => setExpandedId(expanded ? null : event.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`font-medium leading-snug ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
                        {event.title}
                      </p>
                      <p className={`mt-0.5 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {format(new Date(event.startAt), "h:mm a")}
                        {event.endAt && ` – ${format(new Date(event.endAt), "h:mm a")}`}
                        {event.locationName && ` · ${event.locationName}`}
                      </p>
                      {event.category && (
                        <span
                          className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                          style={
                            event.category.color
                              ? { backgroundColor: `${event.category.color}22`, color: event.category.color }
                              : { backgroundColor: "#f3f4f6", color: "#6b7280" }
                          }
                        >
                          {event.category.name}
                        </span>
                      )}
                    </div>
                    <span
                      className={`mt-0.5 shrink-0 text-xs transition-transform ${expanded ? "rotate-180" : ""} ${
                        darkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      ▾
                    </span>
                  </div>

                  {expanded && (
                    <div
                      className="mt-3 space-y-2 border-t pt-3"
                      onClick={(e) => e.stopPropagation()}
                      style={{ borderColor: darkMode ? "#374151" : "#f3f4f6" }}
                    >
                      {event.imageUrl && (
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="h-32 w-full rounded-md object-cover"
                        />
                      )}
                      {event.description && (
                        <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                          {event.description}
                        </p>
                      )}
                      {event.address && (
                        <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                          📍 {event.address}
                        </p>
                      )}
                      {formatCost(event.cost) && (
                        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {formatCost(event.cost)}
                        </p>
                      )}
                      {event.ticketUrl && (
                        <a
                          href={event.ticketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-sm font-medium underline"
                          style={{ color: accent }}
                        >
                          {event.id.startsWith("gcal_") ? "View in Google Calendar →" : "More info / Register →"}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
