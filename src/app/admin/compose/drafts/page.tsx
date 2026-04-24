import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function DraftsPage() {
  return (
    <main className="max-w-5xl px-8 py-8">
      <PageHeader title="Drafts" description="Announcements saved but not yet published." />
      <div className="mt-8">
        <ComingSoon />
      </div>
    </main>
  );
}
