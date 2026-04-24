import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function InboxPage() {
  return (
    <main className="max-w-5xl px-8 py-8">
      <PageHeader
        title="Inbox"
        description="Everything new, in one place."
      />
      <div className="mt-8">
        <ComingSoon />
      </div>
    </main>
  );
}
