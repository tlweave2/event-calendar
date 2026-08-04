import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hashToken, parsePasswordResetIdentifier } from "@/lib/tokens";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata = {
  title: "Choose a new password",
};

async function resolveToken(token: string): Promise<string | null> {
  const record = await prisma.verificationToken.findUnique({
    where: { token: hashToken(token) },
  });
  if (!record || record.expires < new Date()) return null;

  const userId = parsePasswordResetIdentifier(record.identifier);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return user?.email ?? null;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const email = token ? await resolveToken(token) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">Choose a new password</h1>

        {!token || !email ? (
          <>
            <p className="mt-3 text-sm text-gray-600">
              This reset link is invalid or has expired. Reset links are good for one
              hour and can only be used once.
            </p>
            <Link
              href="/admin/forgot-password"
              className="mt-4 inline-block text-sm text-blue-600 underline"
            >
              Request a new link
            </Link>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-gray-600">
              Setting a new password for{" "}
              <span className="font-medium text-gray-900">{email}</span>.
            </p>
            <ResetPasswordForm token={token} email={email} />
          </>
        )}
      </div>
    </div>
  );
}
