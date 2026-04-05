import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EmbedPageClient from "./EmbedPageClient";

export default async function EmbedPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { slug: true, name: true },
  });

  if (!tenant) redirect("/admin");

  const baseUrl =
    process.env.NEXTAUTH_URL ?? "https://event-calendar-oglq.vercel.app";

  return (
    <div className="max-w-3xl px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Embed on Your Website
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Copy and paste these snippets anywhere on your website.
        </p>
      </div>
      <EmbedPageClient slug={tenant.slug} baseUrl={baseUrl} />
    </div>
  );
}
