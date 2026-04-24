import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function BroadcastsPage() {
  return (
    <main className="max-w-5xl px-8 py-8">
      <PageHeader
        title="Broadcasts"
        description="Send email announcements to your contact list."
      />
      <div className="mt-8">
        <ComingSoon />
      </div>
    </main>
  );
}
