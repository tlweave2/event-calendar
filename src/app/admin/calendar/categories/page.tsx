import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function CategoriesPage() {
  return (
    <main className="max-w-5xl px-8 py-8">
      <PageHeader title="Categories" description="Organize events by category." />
      <div className="mt-8">
        <ComingSoon />
      </div>
    </main>
  );
}
