import { LayoutDashboard } from "lucide-react";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500">
            <LayoutDashboard size={24} className="text-white" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Welcome to Hub</h1>
        <p className="mt-2 text-sm text-gray-500">Let&apos;s get your community set up.</p>
        <div className="mt-8">
          <ComingSoon />
        </div>
      </div>
    </div>
  );
}
