import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EmbedEditorClient from "./EmbedEditorClient";

export default async function EmbedPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      id: true,
      slug: true,
      name: true,
      primaryColor: true,
      embedFontFamily: true,
      embedDefaultView: true,
      embedCardStyle: true,
      embedShowFlyerGallery: true,
      embedHideSearch: true,
      embedHideCategories: true,
      embedHideSubmit: true,
      embedBgColor: true,
      embedDarkMode: true,
    },
  });

  if (!tenant) redirect("/admin");

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://www.useventful.com";

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Embed</h1>
        <p className="mt-1 text-sm text-gray-500">
          Customize how your calendar looks when embedded, then copy the code snippet to your website.
        </p>
      </div>

      <EmbedEditorClient
        tenantId={tenant.id}
        slug={tenant.slug}
        baseUrl={baseUrl}
        primaryColor={tenant.primaryColor}
        embedFontFamily={tenant.embedFontFamily}
        embedDefaultView={tenant.embedDefaultView ?? "list"}
        embedCardStyle={tenant.embedCardStyle ?? "modern"}
        embedShowFlyerGallery={tenant.embedShowFlyerGallery ?? false}
        embedHideSearch={tenant.embedHideSearch ?? false}
        embedHideCategories={tenant.embedHideCategories ?? false}
        embedHideSubmit={tenant.embedHideSubmit ?? false}
        embedBgColor={tenant.embedBgColor}
        embedDarkMode={tenant.embedDarkMode ?? false}
      />
    </div>
  );
}
