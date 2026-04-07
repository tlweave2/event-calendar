import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin/demo", label: "Queue" },
  { href: "/admin/demo#events", label: "All Events" },
  { href: "/admin/demo#branding", label: "Branding" },
  { href: "/admin/demo#categories", label: "Categories" },
  { href: "/admin/demo#analytics", label: "Analytics" },
  { href: "/admin/demo#embed", label: "Embed" },
  { href: "/admin/demo#import", label: "Import Flyers" },
  { href: "/admin/demo#settings", label: "Settings" },
];

export default async function DemoPage() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: "demo" },
    select: { id: true, name: true, slug: true },
  });

  if (!tenant) notFound();

  const events = await prisma.event.findMany({
    where: { tenantId: tenant.id, status: "PENDING" },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const totalEvents = await prisma.event.count({ where: { tenantId: tenant.id } });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed inset-x-0 top-0 z-50 bg-violet-600 px-4 py-2 text-center text-sm text-white">
        You&apos;re viewing a live demo - actions are disabled.{" "}
        <Link href="/signup" className="font-semibold underline">
          Create your own calendar →
        </Link>
      </div>

      <aside className="fixed inset-y-0 left-0 top-9 z-40 hidden w-56 flex-col border-r bg-white shadow-sm md:flex">
        <div className="border-b px-5 py-5">
          <span className="text-sm font-semibold text-gray-900">{tenant.name}</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4 text-sm">
          {NAV_ITEMS.map((item, i) => (
            <span
              key={item.href}
              className={`flex items-center justify-between rounded-md px-3 py-2 ${
                i === 0
                  ? "bg-gray-100 font-medium text-gray-900"
                  : "text-gray-500 cursor-default"
              }`}
            >
              {item.label}
              {i === 0 && events.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {events.length}
                </span>
              )}
            </span>
          ))}
          <div className="mt-3 space-y-1 border-t pt-3">
            <Link
              href={`/embed/${tenant.slug}/calendar`}
              target="_blank"
              className="flex items-center rounded-md px-3 py-2 text-blue-600 hover:bg-blue-50"
            >
              View Calendar ↗
            </Link>
            <Link
              href={`/embed/${tenant.slug}/submit`}
              target="_blank"
              className="flex items-center rounded-md px-3 py-2 text-blue-600 hover:bg-blue-50"
            >
              Submit Form ↗
            </Link>
          </div>
        </nav>
        <div className="space-y-3 border-t px-5 py-4">
          <p className="text-xs text-gray-400">demo@eventful.app</p>
          <Link
            href="/signup"
            className="block rounded-md bg-violet-600 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-violet-700"
          >
            Create your own →
          </Link>
        </div>
      </aside>

      <main className="pt-9 md:pl-56">
        <div className="max-w-4xl px-8 py-8">
          <div className="mb-6 grid grid-cols-3 gap-4">
            {[
              { label: "Total Events", value: totalEvents, color: "#2563eb" },
              { label: "Pending Review", value: events.length, color: "#d97706" },
              { label: "Plan", value: "PRO", color: "#7c3aed" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg border bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
                <p className="mt-1 text-2xl font-bold" style={{ color }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Pending Queue</h1>
            <p className="mt-1 text-sm text-gray-500">
              {events.length === 0
                ? "No events pending review."
                : `${events.length} event${events.length !== 1 ? "s" : ""} waiting for review`}
            </p>
          </div>

          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="overflow-hidden rounded-lg border bg-white">
                <div className="flex items-start justify-between px-5 py-4">
                  <div className="min-w-0 flex-1 space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-gray-900">{event.title}</span>
                      {event.category && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {event.category.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {format(new Date(event.startAt), "MMM d, yyyy · h:mm a")}
                      {event.locationName && ` · ${event.locationName}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      Submitted by {event.submitterName} ({event.submitterEmail})
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      disabled
                      title="Sign up to enable moderation"
                      className="cursor-not-allowed rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-400 opacity-60"
                    >
                      Reject
                    </button>
                    <button
                      disabled
                      title="Sign up to enable moderation"
                      className="cursor-not-allowed rounded-md bg-green-600 px-3 py-1.5 text-sm text-white opacity-60"
                    >
                      Approve
                    </button>
                  </div>
                </div>
                {event.description && (
                  <div className="border-t bg-gray-50 px-5 py-3 text-sm text-gray-600 line-clamp-2">
                    {event.description}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-lg border-2 border-violet-200 bg-violet-50 p-6 text-center">
            <p className="text-base font-semibold text-violet-900">
              Ready to run your own community calendar?
            </p>
            <p className="mt-1 text-sm text-violet-700">
              Takes 2 minutes to set up. No credit card required.
            </p>
            <Link
              href="/signup"
              className="mt-4 inline-block rounded-md bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Create your calendar →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
