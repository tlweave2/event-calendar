import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import SetupWizard from "./SetupWizard";

export default async function SetupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session) redirect("/admin/login");

  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  // Only the tenant owner can access their setup page.
  if (tenant.id !== session.user.tenantId) {
    redirect("/admin");
  }

  const requestHeaders = await headers();
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  const baseUrl = host ? `${protocol}://${host}` : "";

  return (
    <div className="app-ui min-h-screen px-5 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 border-b border-gray-900 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Eventful</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">Set up your calendar</h1>
          <p className="mt-2 text-gray-600">
            A few settings, then you can share your calendar and start taking submissions.
          </p>
        </div>
        <SetupWizard tenant={tenant} baseUrl={baseUrl} />
      </div>
    </div>
  );
}