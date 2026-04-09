import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCategories } from "@/lib/prisma-tenant";
import CategoriesForm from "./CategoriesForm";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const categories = await getCategories(session.user.tenantId);

  return (
    <div className="max-w-2xl px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Categories</h1>
        <p className="mt-1 text-sm text-gray-500">
          Categories help organize your events and let visitors filter by type.
          Submitters pick one when they add an event, and each category color
          appears as a badge on event listings.
        </p>
      </div>
      <CategoriesForm
        tenantId={session.user.tenantId}
        initialCategories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color ?? "#6366f1",
          sortOrder: c.sortOrder,
        }))}
      />
    </div>
  );
}
