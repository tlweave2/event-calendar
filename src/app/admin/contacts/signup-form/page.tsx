import { PageHeader } from "@/components/ui/page-header";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function SignupFormPage() {
  return (
    <main className="max-w-5xl px-8 py-8">
      <PageHeader
        title="Signup Form"
        description="Configure your public contact signup form."
      />
      <div className="mt-8">
        <ComingSoon />
      </div>
    </main>
  );
}
