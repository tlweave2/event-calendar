"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo } from "react";
import { isSameMonth } from "date-fns";

type CalendarEvent = {
  id: string;
  title: string;
  startAt: Date;
  imageUrl: string | null;
  category: { id: string; name: string; color: string | null } | null;
};

export default function FlyerGallery({
  events,
  currentMonth,
  tenantSlug,
  darkMode = false,
}: {
  events: CalendarEvent[];
  currentMonth: Date;
  tenantSlug: string;
  darkMode?: boolean;
}) {
  const flyers = useMemo(() => {
    const seen = new Set<string>();
    return events.filter((e) => {
      if (!e.imageUrl) return false;
      if (seen.has(e.id)) return false;
      if (!isSameMonth(new Date(e.startAt), currentMonth)) return false;
      seen.add(e.id);
      return true;
    });
  }, [events, currentMonth]);

  if (flyers.length === 0) return null;

  return (
    <div
      className={`border-t px-4 py-3 ${
        darkMode ? "border-gray-700" : ""
      }`}
    >
      <p
        className={`mb-2 text-xs font-medium ${
          darkMode ? "text-gray-400" : "text-gray-500"
        }`}
      >
        This month&apos;s event flyers
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {flyers.map((event) => (
          <a
            key={event.id}
            href={`/embed/${tenantSlug}/event/${event.id}`}
            className="group relative flex-shrink-0"
          >
            <img
              src={event.imageUrl!}
              alt={event.title}
              className={`h-20 w-20 rounded-lg object-cover transition-transform group-hover:scale-105 ${
                darkMode ? "border border-gray-700" : "border border-gray-200"
              }`}
            />
            <span
              className="absolute bottom-0 left-0 right-0 rounded-b-lg px-1 py-0.5 text-center text-white"
              style={{
                fontSize: "9px",
                fontWeight: 600,
                background:
                  event.category?.color
                    ? `${event.category.color}cc`
                    : "rgba(0,0,0,0.55)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {event.title}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
