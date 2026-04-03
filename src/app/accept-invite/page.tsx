import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { acceptInvite } from "@/lib/actions/accept-invite";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) notFound();

  const invite = await prisma.verificationToken.findUnique({ where: { token } });
  if (!invite || invite.expires < new Date()) notFound();

  const [, email] = invite.identifier.split(":");
  const [roleHint] = token.split(".");

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-gray-400">Invitation</p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">Accept Invitation</h1>
        <p className="mt-3 text-sm text-gray-600">
          {email} has been invited to join this workspace as {roleHint.toUpperCase()}.
        </p>

        <form action={acceptInvite.bind(null, { token })} className="mt-6">
          <button className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Accept Invitation
          </button>
        </form>
      </div>
    </div>
  );
}