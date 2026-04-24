import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function IntegrationsPage() {
  return (
    <main className="max-w-5xl px-8 py-8">
      <PageHeader
        title="Integrations"
        description="Connect Instagram, Facebook, Google Calendar, and more."
      />
      <div className="mt-8">
        <ComingSoon />
      </div>
    </main>
  );
}
