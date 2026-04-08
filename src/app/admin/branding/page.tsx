import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BrandingForm from "./BrandingForm";
import EmbedSettingsForm from "../embed/EmbedSettingsForm";

export default async function BrandingPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
  });
  if (!tenant) redirect("/admin");

  return (
    <div className="max-w-2xl px-8 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Branding</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update your organization name, colors, and calendar URL.
        </p>
      </div>
      <BrandingForm tenant={tenant} />

      <EmbedSettingsForm
        tenantId={tenant.id}
        primaryColor={tenant.primaryColor}
        embedFontFamily={tenant.embedFontFamily}
        embedDefaultView={tenant.embedDefaultView}
        embedCardStyle={tenant.embedCardStyle}
        embedShowFlyerGallery={tenant.embedShowFlyerGallery}
        embedHideSearch={tenant.embedHideSearch}
        embedHideCategories={tenant.embedHideCategories}
        embedHideSubmit={tenant.embedHideSubmit}
        embedBgColor={tenant.embedBgColor}
        embedDarkMode={tenant.embedDarkMode}
      />
    </div>
  );
}
