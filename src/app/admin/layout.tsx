import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Link from "next/link";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Never render admin chrome (sidebar / demo banner) on the login page,
  // even if a session cookie exists (e.g. demo session).  The middleware
  // normally redirects authenticated users away from /admin/login, but
  // this serves as a safety net.
  if (!session) {
    return <>{children}</>;
  }

  const hdrs = await headers();
  const pathname = hdrs.get("x-next-url") ?? hdrs.get("x-invoke-path") ?? "";
  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  const [pendingCount, tenant] = await Promise.all([
    prisma.event.count({
      where: { tenantId: session.user.tenantId, status: "PENDING" },
    }),
    prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true, name: true, isDemoSandbox: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar
        tenantName={tenant?.name ?? "Event Calendar"}
        tenantSlug={tenant?.slug ?? ""}
        email={session.user.email ?? ""}
        pendingCount={pendingCount}
      />
      <main className="min-h-screen pt-14 md:pt-0 md:pl-56">
        {tenant?.isDemoSandbox && (
          <div className="bg-violet-600 px-4 py-2 text-center text-sm text-white">
            You&apos;re in a demo sandbox - changes are yours but expire in 1 hour.{" "}
            <Link href="/signup" className="font-medium underline">
              Create a permanent calendar →
            </Link>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
