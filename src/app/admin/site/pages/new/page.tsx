import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function NewPagePage() {
  return (
    <main className="max-w-5xl px-8 py-8">
      <PageHeader title="New Page" />
      <div className="mt-8">
        <ComingSoon />
      </div>
    </main>
  );
}
