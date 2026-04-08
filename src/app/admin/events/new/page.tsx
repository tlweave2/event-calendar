import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCategories } from "@/lib/prisma-tenant";
import CreateEventForm from "./CreateEventForm";

export default async function NewEventPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const categories = await getCategories(session.user.tenantId);

  return (
    <div className="max-w-2xl px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Create Event</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manually add an event to your calendar. It will be published immediately.
        </p>
      </div>
      <CreateEventForm
        tenantId={session.user.tenantId}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
