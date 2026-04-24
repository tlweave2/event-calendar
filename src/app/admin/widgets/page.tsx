import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function WidgetsPage() {
  return (
    <main className="max-w-5xl px-8 py-8">
      <PageHeader
        title="Widgets"
        description="Embeddable components for your external website."
      />
      <div className="mt-8">
        <ComingSoon />
      </div>
    </main>
  );
}
