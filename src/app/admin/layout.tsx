import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Link from "next/link";
import AdminSidebar from "./AdminSidebar";
import DemoBanner from "./DemoBanner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") ?? "";

  // Never render admin chrome on the login or accept-invite pages.
  // The proxy sets x-pathname on every request so this check is reliable.
  if (
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/admin/accept-invite")
  ) {
    return <>{children}</>;
  }

  const session = await auth();
  if (!session) {
    return <>{children}</>;
  }

  const [pendingCount, tenant] = await Promise.all([
    prisma.event.count({
      where: { tenantId: session.user.tenantId, status: "PENDING" },
    }),
    prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true, name: true, isDemoSandbox: true, plan: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar
        tenantName={tenant?.name ?? "Event Calendar"}
        tenantSlug={tenant?.slug ?? ""}
        plan={tenant?.plan ?? "FREE"}
        role={session.user.role ?? "EDITOR"}
        email={session.user.email ?? ""}
        pendingCount={pendingCount}
      />
      <main className="min-h-screen pt-14 md:pt-0 md:pl-56">
        {tenant?.isDemoSandbox && <DemoBanner />}
        {children}
      </main>
    </div>
  );
}
