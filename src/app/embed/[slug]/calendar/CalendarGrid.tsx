"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  format,
} from "date-fns";

type Category = { id: string; name: string; color: string | null };

type CalendarEvent = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date | null;
  category: Category | null;
  locationName: string | null;
  address: string | null;
  description: string | null;
  cost: string | null;
  ticketUrl: string | null;
  imageUrl: string | null;
};

export default function CalendarGrid({
  events,
  primaryColor,
  onEventClick,
}: {
  events: CalendarEvent[];
  primaryColor: string | null;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const [current, setCurrent] = useState(new Date());
  const accent = primaryColor ?? "#2563eb";

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(current));
    const end = endOfWeek(endOfMonth(current));
    return eachDayOfInterval({ start, end });
  }, [current]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = format(new Date(event.startAt), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return map;
  }, [events]);

  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ backgroundColor: accent }}
      >
        <button
          onClick={() => setCurrent((d) => subMonths(d, 1))}
          className="px-2 text-lg font-light text-white opacity-80 hover:opacity-100"
          aria-label="Previous month"
        >
          ‹
        </button>
        <h2 className="text-lg font-semibold text-white">
          {format(current, "MMMM yyyy")}
        </h2>
        <button
          onClick={() => setCurrent((d) => addMonths(d, 1))}
          className="px-2 text-lg font-light text-white opacity-80 hover:opacity-100"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 border-b">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-2 text-center text-xs font-medium text-gray-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, current);
          const today = isToday(day);

          return (
            <div
              key={key}
              className={`min-h-24 border-b border-r p-1.5 ${index % 7 === 6 ? "border-r-0" : ""} ${
                !inMonth ? "bg-gray-50" : "bg-white"
              }`}
            >
              <div className="mb-1 flex justify-end">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    today ? "text-white" : inMonth ? "text-gray-700" : "text-gray-300"
                  }`}
                  style={today ? { backgroundColor: accent } : undefined}
                >
                  {format(day, "d")}
                </span>
              </div>

              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium text-white"
                    style={{ backgroundColor: event.category?.color ?? accent }}
                  >
                    {format(new Date(event.startAt), "h:mma")} {event.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <p className="px-1 text-xs text-gray-400">+{dayEvents.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}