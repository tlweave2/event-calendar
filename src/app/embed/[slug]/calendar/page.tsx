import { getTenantBySlug } from "@/lib/tenant";
import { getApprovedEvents } from "@/lib/prisma-tenant";
import { notFound } from "next/navigation";
import Image from "next/image";
import CalendarView from "./CalendarView";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const events = await getApprovedEvents(tenant.id);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          {tenant.logoUrl && (
            <Image
              src={tenant.logoUrl}
              alt={tenant.name}
              width={200}
              height={48}
              className="mx-auto mb-4 object-contain"
            />
          )}
          <h1 className="text-2xl font-semibold text-gray-900">{tenant.name}</h1>
          <p className="mt-1 text-sm text-gray-500">Upcoming Events</p>
        </div>

        <CalendarView
          events={events}
          categories={tenant.categories}
          primaryColor={tenant.primaryColor}
          tenantSlug={slug}
        />
      </div>
    </div>
  );
}