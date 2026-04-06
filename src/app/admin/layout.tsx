import { auth } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SignOutButton from "./SignOutButton";

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

  const [pendingCount, tenant] = await Promise.all([
    prisma.event.count({
      where: { tenantId: session.user.tenantId, status: "PENDING" },
    }),
    prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true, name: true },
    }),
  ]);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="flex w-56 flex-col border-r bg-white">
        <div className="border-b px-5 py-5">
          <Link href="/" className="text-sm font-semibold text-gray-900 hover:text-gray-600">
            {tenant?.name ?? "Event Calendar"}
          </Link>
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
            href="/admin/branding"
            className="flex items-center rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            Branding
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
            href="/admin/embed"
            className="flex items-center rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            Embed
          </Link>
          <Link
            href="/admin/import"
            className="flex items-center rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            Import Flyers
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100"
          >
            Settings
          </Link>

          {tenant?.slug && (
            <div className="pt-3 mt-3 border-t">
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
          )}
        </nav>

        <div className="border-t px-5 py-4 space-y-2">
          <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
