"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { getPlanConfig, hasFeature } from "@/lib/plans";

type NavItem = { href: string; label: string; exact?: boolean; feature?: "aiFlyer" };

const NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Moderate",
    items: [
      { href: "/admin", label: "Review queue", exact: true },
      { href: "/admin/events", label: "All events", exact: true },
      { href: "/admin/events/new", label: "New event" },
      { href: "/admin/import", label: "Import flyers", feature: "aiFlyer" },
    ],
  },
  {
    heading: "Calendar",
    items: [
      { href: "/admin/views", label: "Views" },
      { href: "/admin/categories", label: "Categories" },
      { href: "/admin/branding", label: "Branding" },
      { href: "/admin/embed", label: "Embed" },
    ],
  },
  {
    heading: "Account",
    items: [
      { href: "/admin/analytics", label: "Analytics" },
      { href: "/admin/settings", label: "Settings" },
    ],
  },
];

export default function AdminSidebar({
  tenantName,
  tenantSlug,
  plan,
  email,
  pendingCount,
}: {
  tenantName: string;
  tenantSlug: string;
  plan: string;
  email: string;
  pendingCount: number;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // "All events" is exact so it doesn't light up on /admin/events/new;
  // individual event pages (/admin/events/<id>) still count as All events.
  const isActive = (item: NavItem) => {
    if (item.href === "/admin/events") {
      return pathname === item.href || (pathname.startsWith("/admin/events/") && !pathname.startsWith("/admin/events/new"));
    }
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  };

  const planName = getPlanConfig(plan).name;

  const navContent = (
    <>
      <nav className="flex-1 overflow-y-auto px-3 py-5 text-sm">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => !item.feature || hasFeature(plan, item.feature));
          return (
            <div key={group.heading} className="mb-6">
              <p className="mb-1.5 px-3 text-[0.7rem] font-semibold uppercase tracking-wider text-gray-500">
                {group.heading}
              </p>
              <ul>
                {items.map((item) => {
                  const active = isActive(item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center justify-between border-l-2 px-3 py-1.5 ${
                          active
                            ? "border-gray-900 font-semibold text-gray-900"
                            : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
                        }`}
                      >
                        <span>{item.label}</span>
                        {item.href === "/admin" && pendingCount > 0 && (
                          <span className="min-w-6 rounded-sm bg-gray-900 px-1.5 text-center text-xs font-semibold tabular-nums text-white">
                            {pendingCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {tenantSlug && (
          <div className="border-t border-gray-200 px-3 pt-4">
            <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-gray-500">Public pages</p>
            <a
              href={`/embed/${tenantSlug}/calendar`}
              target="_blank"
              rel="noreferrer"
              className="block py-1.5 text-gray-600 underline decoration-gray-300 underline-offset-4 hover:text-gray-900 hover:decoration-gray-900"
            >
              Calendar
            </a>
            <a
              href={`/embed/${tenantSlug}/submit`}
              target="_blank"
              rel="noreferrer"
              className="block py-1.5 text-gray-600 underline decoration-gray-300 underline-offset-4 hover:text-gray-900 hover:decoration-gray-900"
            >
              Submission form
            </a>
          </div>
        )}
      </nav>

      <div className="border-t border-gray-200 px-6 py-4 text-xs">
        <p className="truncate text-gray-600" title={email}>{email}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-1 text-gray-500 underline underline-offset-2 hover:text-gray-900"
        >
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-[var(--paper)] px-4 md:hidden">
        <span className="truncate font-semibold" style={{ fontFamily: "var(--app-serif)" }}>
          {tenantName}
        </span>
        <button
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center text-gray-700 hover:text-gray-900"
          aria-label="Toggle menu"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-30 flex w-64 transform flex-col border-r border-gray-200 bg-[var(--paper)] transition-transform duration-200 ease-in-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ top: "3.5rem" }}
      >
        {navContent}
      </div>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-gray-200 bg-[var(--paper)] md:flex">
        <div className="border-b border-gray-200 px-6 py-5">
          <Link href="/" className="text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900">
            Eventful
          </Link>
          <p className="mt-2 truncate text-lg font-semibold leading-tight" style={{ fontFamily: "var(--app-serif)" }} title={tenantName}>
            {tenantName}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">{planName} plan</p>
        </div>
        {navContent}
      </aside>
    </>
  );
}
