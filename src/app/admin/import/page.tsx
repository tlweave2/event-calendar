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
        <h1 className="text-xl font-semibold text-gray-900">Import from Flyers</h1>
        <div className="mt-6 rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
          <p className="text-lg font-medium text-gray-900">
            This is a Pro feature
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Upgrade to Pro ($99/year) to upload flyers and have AI
            automatically extract event details.
          </p>
          <Link
            href="/admin/settings"
            className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Upgrade to Pro →
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
        <h1 className="text-xl font-semibold text-gray-900">Import from Flyers</h1>
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
