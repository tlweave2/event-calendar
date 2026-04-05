import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCategories } from "@/lib/prisma-tenant";
import ImportFlyersClient from "./ImportFlyersClient";

export default async function ImportPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const categories = await getCategories(session.user.tenantId);

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
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
