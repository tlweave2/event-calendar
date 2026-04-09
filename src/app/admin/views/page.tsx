import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCategories } from "@/lib/prisma-tenant";
import ViewsManager from "./ViewsManager";

export default async function ViewsPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const tenantId = session.user.tenantId;

  const [views, categories, tenant] = await Promise.all([
    prisma.calendarView.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    }),
    getCategories(tenantId),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true },
    }),
  ]);

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://www.useventful.com";

  return (
    <div className="max-w-3xl px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Calendar Views</h1>
        <p className="mt-1 text-sm text-gray-500">
          Views let you embed a filtered version of your calendar on different pages.
          For example, create a &quot;Music Events&quot; view and embed it on your music
          page so visitors only see selected categories.
        </p>
      </div>
      <ViewsManager
        views={views.map((v) => ({
          id: v.id,
          name: v.name,
          slug: v.slug,
          categoryIds: v.categoryIds,
        }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
        }))}
        tenantSlug={tenant?.slug ?? ""}
        baseUrl={baseUrl}
      />
    </div>
  );
}
