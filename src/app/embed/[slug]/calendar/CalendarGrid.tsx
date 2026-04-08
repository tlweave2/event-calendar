"use client";

import { useEffect, useMemo, useState } from "react";
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
  darkMode = false,
  cardStyle = "modern",
  onMonthChange,
}: {
  events: CalendarEvent[];
  primaryColor: string | null;
  onEventClick: (event: CalendarEvent) => void;
  darkMode?: boolean;
  cardStyle?: "modern" | "compact" | "image" | "minimal";
  onMonthChange?: (month: Date) => void;
}) {
  const [current, setCurrent] = useState(new Date());
  const accent = primaryColor ?? "#2563eb";

  useEffect(() => {
    onMonthChange?.(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className={`overflow-hidden rounded-lg border ${darkMode ? "border-gray-700 bg-gray-900" : "bg-white"}`}>
      {cardStyle === "minimal" ? (
        <div
          className={`flex items-center justify-between px-5 py-3 ${
            darkMode ? "text-gray-200" : "text-gray-800"
          }`}
        >
          <button
            onClick={() => {
              setCurrent((d) => {
                const newMonth = subMonths(d, 1);
                onMonthChange?.(newMonth);
                return newMonth;
              });
            }}
            className={`px-2 text-lg font-light ${darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
            aria-label="Previous month"
          >
            ‹
          </button>
          <h2 className="text-lg font-medium">{format(current, "MMMM yyyy")}</h2>
          <button
            onClick={() => {
              setCurrent((d) => {
                const newMonth = addMonths(d, 1);
                onMonthChange?.(newMonth);
                return newMonth;
              });
            }}
            className={`px-2 text-lg font-light ${darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      ) : (
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            backgroundColor: cardStyle === "compact" ? (darkMode ? "#374151" : "#374151") : accent,
          }}
        >
          <button
            onClick={() => {
              setCurrent((d) => {
                const newMonth = subMonths(d, 1);
                onMonthChange?.(newMonth);
                return newMonth;
              });
            }}
            className="px-2 text-lg font-light text-white opacity-80 hover:opacity-100"
            aria-label="Previous month"
          >
            ‹
          </button>
          <h2 className="text-lg font-semibold text-white">
            {format(current, "MMMM yyyy")}
          </h2>
          <button
            onClick={() => {
              setCurrent((d) => {
                const newMonth = addMonths(d, 1);
                onMonthChange?.(newMonth);
                return newMonth;
              });
            }}
            className="px-2 text-lg font-light text-white opacity-80 hover:opacity-100"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      )}

      <div className={`grid grid-cols-7 border-b ${darkMode ? "border-gray-700" : ""}`}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className={`py-2 text-center text-xs font-medium ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
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
                !inMonth
                  ? darkMode ? "bg-gray-800" : "bg-gray-50"
                  : darkMode ? "bg-gray-900" : "bg-white"
              }`}
              style={darkMode ? { borderColor: "#374151" } : undefined}
            >
              <div className="mb-1 flex justify-end">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    today ? "text-white" : inMonth ? (darkMode ? "text-gray-200" : "text-gray-700") : "text-gray-400"
                  }`}
                  style={today ? { backgroundColor: accent } : undefined}
                >
                  {format(day, "d")}
                </span>
              </div>

              <div className="space-y-0.5">
                {cardStyle === "compact" ? (
                  <>
                    {dayEvents.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {dayEvents.slice(0, 5).map((event) => (
                          <button
                            key={event.id}
                            onClick={() => onEventClick(event)}
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: event.category?.color ?? accent }}
                            title={event.title}
                          />
                        ))}
                      </div>
                    )}
                    {dayEvents.length > 5 && (
                      <p className={`text-center text-xs ${darkMode ? "text-gray-600" : "text-gray-300"}`}>
                        +{dayEvents.length - 5}
                      </p>
                    )}
                  </>
                ) : cardStyle === "image" ? (
                  <>
                    {dayEvents.slice(0, 2).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className="flex w-full items-center gap-1 truncate"
                      >
                        {event.imageUrl ? (
                          <img
                            src={event.imageUrl}
                            alt=""
                            className="h-3.5 w-3.5 shrink-0 rounded-sm object-cover"
                          />
                        ) : (
                          <span
                            className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm text-xs ${
                              darkMode ? "bg-gray-700 text-gray-500" : "bg-gray-100 text-gray-400"
                            }`}
                            style={{ fontSize: "7px" }}
                          >
                            {event.title.charAt(0)}
                          </span>
                        )}
                        <span
                          className={`truncate text-xs font-medium ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                          style={{ fontSize: "10px" }}
                        >
                          {event.title}
                        </span>
                      </button>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className={`px-1 text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                        +{dayEvents.length - 2} more
                      </p>
                    )}
                  </>
                ) : cardStyle === "minimal" ? (
                  <>
                    {dayEvents.slice(0, 2).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className={`w-full truncate text-left ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                        style={{ fontSize: "10px" }}
                      >
                        {event.title}
                      </button>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className={`text-xs ${darkMode ? "text-gray-600" : "text-gray-300"}`}>
                        +{dayEvents.length - 2}
                      </p>
                    )}
                  </>
                ) : (
                  <>
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
                      <p className={`px-1 text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}