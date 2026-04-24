import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function SubmissionsPage() {
  return (
    <main className="max-w-5xl px-8 py-8">
      <PageHeader
        title="Submissions"
        description="Review and moderate community-submitted events."
      />
      <div className="mt-8">
        <ComingSoon />
      </div>
    </main>
  );
}
