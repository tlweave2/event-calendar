"use client";

import Link from "next/link";
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
import CalendarGrid from "./CalendarGrid";
import EventModal from "./EventModal";
import ImageLightbox from "./ImageLightbox";

type ViewMode = "list" | "grid";

type Category = { id: string; name: string; color: string | null };

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
  category: Category | null;
};

export default function CalendarView({
  events,
  categories,
  primaryColor,
  tenantSlug,
  defaultView = "list",
  hideSearch = false,
  hideCategories = false,
  hideSubmit = false,
  showBadge = true,
  darkMode = false,
  cardStyle = "modern",
}: {
  events: CalendarEvent[];
  categories: Category[];
  primaryColor: string | null;
  tenantSlug: string;
  defaultView?: "list" | "grid";
  hideSearch?: boolean;
  hideCategories?: boolean;
  hideSubmit?: boolean;
  showBadge?: boolean;
  darkMode?: boolean;
  cardStyle?: "modern" | "compact" | "image" | "minimal";
}) {
  const [view, setView] = useState<ViewMode>(defaultView);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalEvent, setModalEvent] = useState<CalendarEvent | null>(null);

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
      <div className={`py-20 text-center ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
        <p className="text-lg">No upcoming events</p>
        {!hideSubmit && (
          <a
            href={`/embed/${tenantSlug}/submit`}
            className="mt-4 inline-block text-sm underline"
            style={{ color: accent }}
          >
            Submit an event
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {!hideSearch && (
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`max-w-xs ${darkMode ? "border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-400" : "bg-white"}`}
          />
        )}

        {!hideCategories && categories.length > 0 && (
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value ?? "all")}
          >
            <SelectTrigger className={`w-44 ${darkMode ? "border-gray-700 bg-gray-800 text-gray-100" : "bg-white"}`}>
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

        <div className={`ml-auto flex overflow-hidden rounded-md border ${darkMode ? "border-gray-700 bg-gray-800" : "bg-white"}`}>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              view === "list" ? "text-white" : "text-gray-500 hover:text-gray-700"
            }`}
            style={view === "list" ? { backgroundColor: accent } : undefined}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`border-l px-3 py-1.5 text-sm font-medium transition-colors ${
              view === "grid" ? "text-white" : "text-gray-500 hover:text-gray-700"
            }`}
            style={view === "grid" ? { backgroundColor: accent } : undefined}
          >
            Calendar
          </button>
        </div>

        {!hideSubmit && (
          <a
            href={`/embed/${tenantSlug}/submit`}
            className="self-center text-sm font-medium underline"
            style={{ color: accent }}
          >
            + Submit an Event
          </a>
        )}
      </div>

      {view === "list" && (search || categoryFilter !== "all") ? (
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {filtered.length} event{filtered.length !== 1 ? "s" : ""} found
        </p>
      ) : null}

      {view === "grid" ? (
        <CalendarGrid
          events={filtered}
          primaryColor={primaryColor}
          darkMode={darkMode}
          onEventClick={(event) => setModalEvent(event)}
          cardStyle={cardStyle}
        />
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className={`py-12 text-center ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              No events match your search.
            </p>
          ) : (
            filtered.map((event) => {
              if (cardStyle === "compact") {
                return (
                  <CompactEventRow
                    key={event.id}
                    event={event}
                    accent={accent}
                    tenantSlug={tenantSlug}
                    darkMode={darkMode}
                  />
                );
              }
              if (cardStyle === "image") {
                return (
                  <ImageEventCard
                    key={event.id}
                    event={event}
                    accent={accent}
                    tenantSlug={tenantSlug}
                    darkMode={darkMode}
                  />
                );
              }
              if (cardStyle === "minimal") {
                return (
                  <MinimalEventRow
                    key={event.id}
                    event={event}
                    tenantSlug={tenantSlug}
                    darkMode={darkMode}
                  />
                );
              }
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  expanded={expandedId === event.id}
                  onToggle={() =>
                    setExpandedId(expandedId === event.id ? null : event.id)
                  }
                  accent={accent}
                  tenantSlug={tenantSlug}
                  darkMode={darkMode}
                />
              );
            })
          )}
        </div>
      )}

      {modalEvent && (
        <EventModal
          event={modalEvent}
          onClose={() => setModalEvent(null)}
          primaryColor={primaryColor}
          tenantSlug={tenantSlug}
          darkMode={darkMode}
        />
      )}

      <div className="border-t pt-4 text-center">
        <Link
          href={`/embed/${tenantSlug}/calendar/feed.ics`}
          className={`text-xs underline ${darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
        >
          Subscribe to calendar (.ics)
        </Link>
      </div>

      {showBadge && (
        <div className="border-t pt-3 text-center">
          <a
            href="https://eventful.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-500"
          >
            Powered by Eventful
          </a>
        </div>
      )}
    </div>
  );
}

function EventCard({
  event,
  expanded,
  onToggle,
  accent,
  tenantSlug,
  darkMode,
}: {
  event: CalendarEvent;
  expanded: boolean;
  onToggle: () => void;
  accent: string;
  tenantSlug: string;
  darkMode: boolean;
}) {
  const isHappeningToday = isToday(new Date(event.startAt));
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <Card
      className={`cursor-pointer overflow-hidden transition-shadow hover:shadow-md ${darkMode ? "border-gray-700 bg-gray-800" : ""}`}
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
                  <h3 className={`truncate font-medium ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{event.title}</h3>
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
                <p className={`mt-0.5 text-sm ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                  {format(new Date(event.startAt), "h:mm a")}
                  {event.endAt &&
                    ` - ${format(new Date(event.endAt), "h:mm a")}`}
                  {event.locationName && ` · ${event.locationName}`}
                </p>
                {event.cost && (
                  <p className={`mt-0.5 text-xs ${darkMode ? "text-gray-400" : "text-gray-400"}`}>{event.cost}</p>
                )}
              </div>
            </div>

            {expanded && (
              <div
                className="mt-3 space-y-2 border-t pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                {event.imageUrl && (
                  <div>
                    <div
                      className="inline-block cursor-zoom-in overflow-hidden rounded-md border"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxOpen(true);
                      }}
                    >
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="h-24 w-24 object-cover transition-transform hover:scale-105"
                      />
                    </div>
                    <p className="text-xs text-gray-400">Click to view full flyer</p>
                  </div>
                )}
                {event.description && (
                  <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{event.description}</p>
                )}
                {event.address && (
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{`Location: ${event.address}`}</p>
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
                <Link
                  href={`/embed/${tenantSlug}/event/${event.id}`}
                  className="mt-2 inline-block text-sm font-medium underline"
                  style={{ color: accent }}
                  onClick={(e) => e.stopPropagation()}
                >
                  View full details & share →
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {lightboxOpen && event.imageUrl && (
        <ImageLightbox
          src={event.imageUrl}
          alt={event.title}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </Card>
  );
}

function CompactEventRow({
  event,
  accent,
  tenantSlug,
  darkMode,
}: {
  event: CalendarEvent;
  accent: string;
  tenantSlug: string;
  darkMode: boolean;
}) {
  return (
    <a
      href={`/embed/${tenantSlug}/event/${event.id}`}
      className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 transition-colors ${
        darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"
      }`}
      style={{ borderBottom: `1px solid ${darkMode ? "#374151" : "#f3f4f6"}` }}
    >
      <div className="flex min-w-0 items-center gap-2">
        {event.category?.color && (
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: event.category.color }}
          />
        )}
        <span className={`truncate text-sm font-medium ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
          {event.title}
        </span>
        {event.locationName && (
          <span className={`hidden truncate text-xs sm:inline ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            · {event.locationName}
          </span>
        )}
      </div>
      <span className={`shrink-0 text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
        {format(new Date(event.startAt), "MMM d, h:mm a")}
      </span>
    </a>
  );
}

function ImageEventCard({
  event,
  accent,
  tenantSlug,
  darkMode,
}: {
  event: CalendarEvent;
  accent: string;
  tenantSlug: string;
  darkMode: boolean;
}) {
  return (
    <a
      href={`/embed/${tenantSlug}/event/${event.id}`}
      className={`flex gap-3 rounded-lg border p-3 transition-shadow hover:shadow-md ${
        darkMode ? "border-gray-700 bg-gray-800" : "bg-white"
      }`}
    >
      {event.imageUrl ? (
        <img
          src={event.imageUrl}
          alt={event.title}
          className="h-20 w-20 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div
          className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-lg text-2xl ${
            darkMode ? "bg-gray-700 text-gray-500" : "bg-gray-100 text-gray-300"
          }`}
        >
          {event.title.charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className={`truncate text-sm font-medium ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
          {event.title}
        </h3>
        <p className={`mt-0.5 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {format(new Date(event.startAt), "MMM d · h:mm a")}
          {event.endAt && ` - ${format(new Date(event.endAt), "h:mm a")}`}
        </p>
        {event.locationName && (
          <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            {event.locationName}
          </p>
        )}
        <div className="mt-1 flex items-center gap-2">
          {event.cost && (
            <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {event.cost}
            </span>
          )}
          {event.category && (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={
                event.category.color
                  ? { backgroundColor: `${event.category.color}22`, color: event.category.color }
                  : {}
              }
            >
              {event.category.name}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

function MinimalEventRow({
  event,
  tenantSlug,
  darkMode,
}: {
  event: CalendarEvent;
  tenantSlug: string;
  darkMode: boolean;
}) {
  return (
    <a
      href={`/embed/${tenantSlug}/event/${event.id}`}
      className={`block py-2 ${darkMode ? "hover:text-gray-200" : "hover:text-gray-700"}`}
      style={{ borderBottom: `1px solid ${darkMode ? "#1f2937" : "#f3f4f6"}` }}
    >
      <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
        {format(new Date(event.startAt), "EEEE, MMMM d · h:mm a")}
      </p>
      <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
        {event.title}
        {event.locationName && (
          <span className={darkMode ? "text-gray-500" : "text-gray-400"}>
            {" "}- {event.locationName}
          </span>
        )}
      </p>
    </a>
  );
}