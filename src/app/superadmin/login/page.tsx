import { redirect } from "next/navigation";
import { isSuperadmin, isSuperadminConfigured } from "@/lib/superadmin";
import { superadminLogin } from "@/lib/actions/superadmin-auth";

export const metadata = { title: "Operator sign in" };

const ERRORS: Record<string, string> = {
  invalid: "That secret is not correct.",
  throttled: "Too many attempts. Try again in a few minutes.",
};

export default async function SuperadminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isSuperadmin()) redirect("/superadmin");

  const { error } = await searchParams;
  const configured = isSuperadminConfigured();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h1 className="text-lg font-semibold text-white">Operator console</h1>
        <p className="mt-1 text-sm text-gray-400">
          Internal. Not a customer sign-in.
        </p>

        {!configured ? (
          <p className="mt-5 rounded-md bg-amber-950 p-3 text-sm text-amber-200">
            Set <code className="font-mono">SUPERADMIN_SECRET</code> and{" "}
            <code className="font-mono">AUTH_SECRET</code> to enable this console.
          </p>
        ) : (
          <form action={superadminLogin} className="mt-5 space-y-3">
            {error && ERRORS[error] && (
              <p className="rounded-md bg-red-950 p-3 text-sm text-red-200" role="alert">
                {ERRORS[error]}
              </p>
            )}
            <input
              type="password"
              name="secret"
              required
              autoFocus
              placeholder="Operator secret"
              autoComplete="off"
              className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-gray-500"
            />
            <button
              type="submit"
              className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-900"
            >
              Sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
