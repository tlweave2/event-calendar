"use client";

import { useState } from "react";
import { format } from "date-fns";
import ImageLightbox from "../calendar/ImageLightbox";

type FlyerEvent = {
  id: string;
  title: string;
  startAt: Date;
  imageUrl: string;
  locationName: string | null;
  category: { id: string; name: string; color: string | null } | null;
};

export default function FlyerGrid({
  events,
  primaryColor,
  darkMode = false,
}: {
  events: FlyerEvent[];
  primaryColor: string | null;
  darkMode?: boolean;
}) {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const accent = primaryColor ?? "#2563eb";

  if (events.length === 0) {
    return (
      <p className={`py-12 text-center text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
        No event flyers yet
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {events.map((event) => (
          <div
            key={event.id}
            className={`group cursor-zoom-in overflow-hidden rounded-xl border ${
              darkMode ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white"
            } shadow-sm`}
            onClick={() => setLightbox({ src: event.imageUrl, alt: event.title })}
          >
            <div className="relative aspect-square overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.imageUrl}
                alt={event.title}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              {event.category && (
                <span
                  className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: event.category.color ?? accent }}
                >
                  {event.category.name}
                </span>
              )}
            </div>
            <div className="px-3 py-2">
              <p className={`truncate text-xs font-semibold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
                {event.title}
              </p>
              <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                {format(new Date(event.startAt), "MMM d · h:mm a")}
              </p>
              {event.locationName && (
                <p className={`truncate text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                  {event.locationName}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
