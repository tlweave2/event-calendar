import { auth } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // /admin/login also uses this layout. Returning children for anonymous users
  // prevents a self-redirect loop while middleware guards protected admin routes.
  if (!session) {
    return <>{children}</>;
  }

  const pendingCount = await prisma.event.count({
    where: { tenantId: session.user.tenantId, status: "PENDING" },
  });

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r bg-white">
        <div className="border-b px-5 py-5">
          <span className="text-sm font-semibold text-gray-900">
            Event Calendar
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4 text-sm">
          <Link
            href="/admin"
            className="flex items-center justify-between rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            <span>Queue</span>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {pendingCount}
              </span>
            )}
          </Link>
          <Link
            href="/admin/events"
            className="flex items-center rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            All Events
          </Link>
          <Link
            href="/admin/categories"
            className="flex items-center rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            Categories
          </Link>
          <Link
            href="/admin/analytics"
            className="flex items-center rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            Analytics
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            Settings
          </Link>
        </nav>
        <div className="border-t px-5 py-4 text-xs text-gray-400">
          {session.user.email}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
