import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function NavigationPage() {
  return (
    <main className="max-w-5xl px-8 py-8">
      <PageHeader
        title="Navigation"
        description="Configure your site menu and navigation links."
      />
      <div className="mt-8">
        <ComingSoon />
      </div>
    </main>
  );
}
