import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function ScheduledPage() {
  return (
    <main className="max-w-5xl px-8 py-8">
      <PageHeader title="Scheduled" description="Announcements queued for future publication." />
      <div className="mt-8">
        <ComingSoon />
      </div>
    </main>
  );
}
