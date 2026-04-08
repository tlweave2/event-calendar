"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/admin", label: "Queue", exact: true },
  { href: "/admin/events", label: "All Events" },
  { href: "/admin/events/new", label: "Create Event" },
  { href: "/admin/branding", label: "Branding" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/embed", label: "Embed" },
  { href: "/admin/import", label: "Import Flyers" },
  { href: "/admin/settings", label: "Settings" },
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

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const navItems =
    plan === "PRO"
      ? NAV_ITEMS
      : NAV_ITEMS.filter((item) => item.href !== "/admin/import");

  const navContent = (
    <>
      <nav className="flex-1 space-y-1 px-3 py-4 text-sm">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center justify-between rounded-md px-3 py-2 transition-colors ${
              isActive(item.href, item.exact)
                ? "bg-gray-100 font-medium text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span>{item.label}</span>
            {item.href === "/admin" && item.exact && pendingCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {pendingCount}
              </span>
            )}
          </Link>
        ))}

        {tenantSlug && (
          <div className="mt-3 border-t pt-3 space-y-1">
            <Link
              href={`/embed/${tenantSlug}/calendar`}
              target="_blank"
              onClick={() => setOpen(false)}
              className="flex items-center rounded-md px-3 py-2 text-blue-600 hover:bg-blue-50"
            >
              View Calendar ↗
            </Link>
            <Link
              href={`/embed/${tenantSlug}/submit`}
              target="_blank"
              onClick={() => setOpen(false)}
              className="flex items-center rounded-md px-3 py-2 text-blue-600 hover:bg-blue-50"
            >
              Submit Form ↗
            </Link>
          </div>
        )}
      </nav>

      <div className="border-t px-5 py-4 space-y-2">
        <p className="text-xs text-gray-400 truncate">{email}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-white px-4 md:hidden">
        <span className="text-sm font-semibold text-gray-900 truncate">
          {tenantName}
        </span>
        <button
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
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
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-200 ease-in-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ top: "3.5rem" }}
      >
        {navContent}
      </div>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r bg-white md:flex">
        <div className="border-b px-5 py-5">
          <Link href="/" className="text-sm font-semibold text-gray-900 hover:text-gray-600">
            {tenantName}
          </Link>
        </div>
        {navContent}
      </aside>
    </>
  );
}
