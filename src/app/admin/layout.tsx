import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import HubSidebar from "./HubSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") ?? "";

  if (
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/admin/register") ||
    pathname.startsWith("/admin/onboarding")
  ) {
    return <>{children}</>;
  }

  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const tenant = session.user.tenantId
    ? await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { name: true, plan: true },
      })
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <HubSidebar
        orgName={tenant?.name ?? "Hub"}
        plan={tenant?.plan ?? "FREE"}
        email={session.user.email ?? ""}
      />
      <main className="min-h-screen pt-14 md:pt-0 md:pl-56">
        {children}
      </main>
    </div>
  );
}
