import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function ApiKeysPage() {
  return (
    <main className="max-w-5xl px-8 py-8">
      <PageHeader title="API Keys" description="Manage API access for Team plan integrations." />
      <div className="mt-8">
        <ComingSoon />
      </div>
    </main>
  );
}
