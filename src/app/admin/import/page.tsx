import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCategories } from "@/lib/prisma-tenant";
import { checkFeatureAccess } from "@/lib/plan-limits";
import ImportFlyersClient from "./ImportFlyersClient";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ImportPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const access = await checkFeatureAccess(session.user.tenantId, "aiFlyer");

  if (!access.allowed) {
    return (
      <div className="max-w-5xl px-8 py-8">
        <h1 className="text-3xl font-semibold text-gray-900">Import flyers</h1>
        <div className="mt-6 rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
          <p className="text-lg font-medium text-gray-900">
            Flyer import is part of Pro and Enterprise
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Upload photos of event flyers and the title, date, time and place
            are filled in for you to check. Pro is $99 a year.
          </p>
          <Link
            href="/admin/settings"
            className="mt-4 inline-block rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            See plans
          </Link>
        </div>
      </div>
    );
  }

  const [categories, tenant] = await Promise.all([
    getCategories(session.user.tenantId),
    prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true },
    }),
  ]);

  return (
    <div className="max-w-5xl px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Import flyers</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload event flyers and AI will extract the details automatically.
        </p>
      </div>
      <ImportFlyersClient
        tenantId={session.user.tenantId}
        tenantSlug={tenant?.slug ?? ""}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
