import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function SitePagesPage() {
  return (
    <main className="max-w-5xl px-8 py-8">
      <PageHeader
        title="Pages"
        description="Build and publish your community site pages."
      />
      <div className="mt-8">
        <ComingSoon />
      </div>
    </main>
  );
}
