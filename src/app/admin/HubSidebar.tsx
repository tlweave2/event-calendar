"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Inbox,
  Globe,
  PenSquare,
  CalendarDays,
  Users,
  LayoutGrid,
  Palette,
  Settings,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react";

const PRIMARY_NAV = [
  { href: "/admin/inbox", label: "Inbox", icon: Inbox },
  { href: "/admin/site", label: "Site", icon: Globe },
  { href: "/admin/compose", label: "Compose", icon: PenSquare },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/contacts", label: "Contacts", icon: Users },
  { href: "/admin/widgets", label: "Widgets", icon: LayoutGrid },
];

const SECONDARY_NAV = [
  { href: "/admin/brand", label: "Brand", icon: Palette },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function HubSidebar({
  orgName,
  plan,
  email,
  inboxCount = 0,
}: {
  orgName: string;
  plan: string;
  email: string;
  inboxCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  const planLabel =
    plan === "PRO" ? "Pro" : plan === "TEAM" ? "Team" : "Free";

  const navContent = (
    <>
      <nav className="flex-1 space-y-0.5 px-3 py-4 text-sm">
        {PRIMARY_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center justify-between rounded-md px-3 py-2 transition-colors ${
              isActive(href)
                ? "bg-gray-100 font-medium text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Icon size={16} />
              {label}
            </span>
            {href === "/admin/inbox" && inboxCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                {inboxCount}
              </span>
            )}
          </Link>
        ))}

        <div className="my-2 border-t border-gray-100" />

        {SECONDARY_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
              isActive(href)
                ? "bg-gray-100 font-medium text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-gray-100 px-5 py-4 space-y-2">
        <p className="truncate text-xs text-gray-400">{email}</p>
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              planLabel === "Pro"
                ? "bg-indigo-50 text-indigo-700"
                : planLabel === "Team"
                ? "bg-violet-50 text-violet-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {planLabel}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={18} className="text-indigo-500" />
          <span className="text-sm font-semibold text-gray-900">Hub</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-200 ease-in-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ top: "3.5rem" }}
      >
        {navContent}
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-5">
          <LayoutDashboard size={18} className="text-indigo-500" />
          <span className="text-sm font-semibold text-gray-900">Hub</span>
        </div>
        {navContent}
      </aside>
    </>
  );
}
