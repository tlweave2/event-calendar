import { getTenantBySlug } from "@/lib/tenant";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import SetupWizard from "./SetupWizard";

export default async function SetupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const requestHeaders = await headers();
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  const baseUrl = host ? `${protocol}://${host}` : "";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Set up your calendar</h1>
          <p className="mt-2 text-sm text-gray-500">
            You are a few steps away from going live.
          </p>
        </div>
        <SetupWizard tenant={tenant} baseUrl={baseUrl} />
      </div>
    </div>
  );
}