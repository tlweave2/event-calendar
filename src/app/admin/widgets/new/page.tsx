import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function NewWidgetPage() {
  return (
    <main className="max-w-5xl px-8 py-8">
      <PageHeader title="New Widget" />
      <div className="mt-8">
        <ComingSoon />
      </div>
    </main>
  );
}
