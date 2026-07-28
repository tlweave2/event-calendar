import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BrandingForm from "./BrandingForm";

export default async function BrandingPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
  });
  if (!tenant) redirect("/admin");

  return (
    <div className="max-w-2xl px-4 py-6 sm:px-8 sm:py-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Branding</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your organization&apos;s identity — logo, name, colors, and timezone. These apply across your calendar, submission form, and hosted pages.
        </p>
      </div>
      <BrandingForm tenant={tenant} />
    </div>
  );
}
