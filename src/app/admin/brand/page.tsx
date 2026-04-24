import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function BrandPage() {
  return (
    <main className="max-w-5xl px-8 py-8">
      <PageHeader
        title="Brand"
        description="Colors, fonts, logo, and domain for your Hub site."
      />
      <div className="mt-8">
        <ComingSoon />
      </div>
    </main>
  );
}
