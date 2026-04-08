"use client";

type StyleOption = {
  value: string;
  label: string;
  description: string;
};

const STYLES: StyleOption[] = [
  {
    value: "modern",
    label: "Modern",
    description: "Colored date blocks, expandable cards",
  },
  {
    value: "compact",
    label: "Compact",
    description: "Dense single-line, fits more events",
  },
  {
    value: "image",
    label: "Image Forward",
    description: "Thumbnail images, visual and bold",
  },
  {
    value: "minimal",
    label: "Minimal",
    description: "Plain text, blends into any site",
  },
];

export default function CalendarStylePicker({
  value,
  onChange,
  accentColor = "#2563eb",
}: {
  value: string;
  onChange: (style: string) => void;
  accentColor?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Calendar Style</label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {STYLES.map((style) => (
          <button
            key={style.value}
            type="button"
            onClick={() => onChange(style.value)}
            className={`group relative overflow-hidden rounded-lg border-2 bg-white text-left transition-all ${
              value === style.value
                ? "border-blue-600 ring-2 ring-blue-100"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="border-b bg-gray-50 px-3 py-3">
              <StylePreview style={style.value} accent={accentColor} />
            </div>

            <div className="px-3 py-2.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">{style.label}</p>
                {value === style.value && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    Active
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-500">{style.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StylePreview({ style, accent }: { style: string; accent: string }) {
  if (style === "modern") return <ModernPreview accent={accent} />;
  if (style === "compact") return <CompactPreview />;
  if (style === "image") return <ImagePreview />;
  return <MinimalPreview />;
}

function ModernPreview({ accent }: { accent: string }) {
  return (
    <div className="space-y-1.5">
      {[
        { title: "Farmers Market", time: "9 AM", cat: "#059669" },
        { title: "Jazz in the Park", time: "6 PM", cat: "#7c3aed" },
        { title: "Art Walk", time: "5 PM", cat: "#db2777" },
      ].map((e) => (
        <div key={e.title} className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 shrink-0 flex-col items-center justify-center rounded text-white"
            style={{ backgroundColor: accent, fontSize: "7px", lineHeight: 1.2 }}
          >
            <span style={{ fontSize: "6px", opacity: 0.8 }}>JUL</span>
            <span className="font-bold" style={{ fontSize: "10px" }}>12</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-gray-800">{e.title}</p>
            <p className="text-xs text-gray-400" style={{ fontSize: "9px" }}>{e.time}</p>
          </div>
          <span
            className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: e.cat }}
          />
        </div>
      ))}
    </div>
  );
}

function CompactPreview() {
  return (
    <div className="space-y-0">
      {[
        { title: "Farmers Market", date: "Jul 12", cat: "#059669" },
        { title: "Jazz in the Park", date: "Jul 15", cat: "#7c3aed" },
        { title: "Art Walk", date: "Jul 18", cat: "#db2777" },
        { title: "Food Truck Friday", date: "Jul 20", cat: "#d97706" },
        { title: "Soccer Tourney", date: "Jul 22", cat: "#2563eb" },
      ].map((e) => (
        <div
          key={e.title}
          className="flex items-center justify-between border-b border-gray-100 py-1 last:border-0"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: e.cat }}
            />
            <span className="text-xs font-medium text-gray-700" style={{ fontSize: "10px" }}>
              {e.title}
            </span>
          </div>
          <span className="text-gray-400" style={{ fontSize: "9px" }}>{e.date}</span>
        </div>
      ))}
    </div>
  );
}

function ImagePreview() {
  return (
    <div className="space-y-1.5">
      {[
        { title: "Farmers Market", letter: "F", date: "Jul 12", bg: "#e5e7eb" },
        { title: "Jazz in the Park", letter: "J", date: "Jul 15", bg: "#ddd6fe" },
        { title: "Art Walk", letter: "A", date: "Jul 18", bg: "#fce7f3" },
      ].map((e) => (
        <div key={e.title} className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
            style={{ backgroundColor: e.bg, fontSize: "11px", color: "#6b7280", fontWeight: 600 }}
          >
            {e.letter}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-gray-800">{e.title}</p>
            <p className="text-gray-400" style={{ fontSize: "9px" }}>{e.date} · Free</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MinimalPreview() {
  return (
    <div className="space-y-1">
      {[
        { date: "Saturday, July 12", title: "Farmers Market at City Plaza" },
        { date: "Tuesday, July 15", title: "Jazz in the Park" },
        { date: "Friday, July 18", title: "Art Walk — Downtown" },
        { date: "Sunday, July 20", title: "Food Truck Friday on Main St" },
      ].map((e) => (
        <div key={e.title} className="border-b border-gray-100 pb-1 last:border-0">
          <p className="text-gray-400" style={{ fontSize: "8px" }}>{e.date}</p>
          <p className="text-gray-700" style={{ fontSize: "10px" }}>{e.title}</p>
        </div>
      ))}
    </div>
  );
}
