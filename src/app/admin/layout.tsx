import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      select: { slug: true, name: true },
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
        {children}
      </main>
    </div>
  );
}
