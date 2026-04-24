import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function ContactsPage() {
  return (
    <main className="max-w-5xl px-8 py-8">
      <PageHeader
        title="Contacts"
        description="Everyone who has engaged with your community."
      />
      <div className="mt-8">
        <ComingSoon />
      </div>
    </main>
  );
}
