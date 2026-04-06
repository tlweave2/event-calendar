"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ImageLightbox from "./ImageLightbox";

type CalendarEvent = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date | null;
  category: { name: string; color: string | null } | null;
  locationName: string | null;
  address: string | null;
  description: string | null;
  cost: string | null;
  ticketUrl: string | null;
  imageUrl: string | null;
};

export default function EventModal({
  event,
  onClose,
  primaryColor,
  tenantSlug,
  darkMode = false,
}: {
  event: CalendarEvent;
  onClose: () => void;
  primaryColor: string | null;
  tenantSlug: string;
  darkMode?: boolean;
}) {
  const accent = primaryColor ?? "#2563eb";
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={lightboxOpen ? undefined : onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className={`w-full max-w-md overflow-hidden rounded-xl shadow-xl ${darkMode ? "bg-gray-900" : "bg-white"}`}>
          <div
            className="h-2"
            style={{ backgroundColor: event.category?.color ?? accent }}
          />

          <div className="flex items-start justify-between gap-3 p-6 pb-0">
            <h2 className={`text-lg font-semibold leading-snug ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
              {event.title}
            </h2>
            <button
              onClick={onClose}
              className={`shrink-0 text-xl leading-none ${darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
              aria-label="Close event details"
            >
              ×
            </button>
          </div>

          {event.imageUrl && (
            <div className="px-6 pt-4">
              <div
                className="inline-block cursor-zoom-in overflow-hidden rounded-md border"
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="h-24 w-24 object-cover transition-transform hover:scale-105"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Click to view full flyer</p>
            </div>
          )}

          <div className="space-y-4 p-6">
            <div className="space-y-2 text-sm">
              <div className={`flex gap-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                <span>🗓</span>
                <span>
                  {format(new Date(event.startAt), "EEEE, MMMM d, yyyy")}
                  <br />
                  {format(new Date(event.startAt), "h:mm a")}
                  {event.endAt && ` – ${format(new Date(event.endAt), "h:mm a")}`}
                </span>
              </div>

              {event.locationName && (
                <div className={`flex gap-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  <span>📍</span>
                  <span>{event.locationName}</span>
                </div>
              )}

              {event.cost && (
                <div className={`flex gap-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  <span>💰</span>
                  <span>{event.cost}</span>
                </div>
              )}

              {event.category && (
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: event.category.color ?? accent }}
                  />
                  <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{event.category.name}</span>
                </div>
              )}
            </div>

            {event.description && (
              <p className={`border-t pt-3 text-sm leading-relaxed ${darkMode ? "border-gray-700 text-gray-300" : "text-gray-600"}`}>
                {event.description}
              </p>
            )}

            {event.ticketUrl && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full" style={{ backgroundColor: accent }}>
                  Tickets / Register →
                </Button>
              </a>
            )}

            <Link
              href={`/embed/${tenantSlug}/event/${event.id}`}
              className="block text-center text-sm underline"
              style={{ color: accent }}
            >
              View full details & share →
            </Link>
          </div>
        </div>
      </div>

      {lightboxOpen && event.imageUrl && (
        <ImageLightbox
          src={event.imageUrl}
          alt={event.title}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}