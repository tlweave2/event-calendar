import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function BillingPage() {
  return (
    <main className="max-w-5xl px-8 py-8">
      <PageHeader title="Billing" description="Manage your plan and payment details." />
      <div className="mt-8">
        <ComingSoon />
      </div>
    </main>
  );
}
