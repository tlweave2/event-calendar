/* eslint-disable @next/next/no-img-element */

import { getTenantBySlug } from "@/lib/tenant";
import { notFound } from "next/navigation";
import SubmitEventForm from "./SubmitEventForm";

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);

  if (!tenant) notFound();

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          {tenant.logoUrl && (
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="mx-auto mb-4 h-12 object-contain"
            />
          )}
          <h1 className="text-2xl font-semibold text-gray-900">
            Submit an Event
          </h1>
          <p className="mt-1 text-sm text-gray-500">to {tenant.name}</p>
        </div>
        <SubmitEventForm
          tenantSlug={slug}
          categories={tenant.categories}
          primaryColor={tenant.primaryColor}
        />
      </div>
    </div>
  );
}
