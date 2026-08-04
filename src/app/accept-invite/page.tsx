import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { hashToken, parseInviteIdentifier } from "@/lib/tokens";
import AcceptInviteForm from "./AcceptInviteForm";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) notFound();

  // Tokens are stored hashed, so look up by hash.
  const invite = await prisma.verificationToken.findUnique({
    where: { token: hashToken(token) },
  });
  if (!invite || invite.expires < new Date()) notFound();

  const parsed = parseInviteIdentifier(invite.identifier);
  if (!parsed) notFound();

  const tenant = await prisma.tenant.findUnique({
    where: { id: parsed.tenantId },
    select: { name: true },
  });
  if (!tenant) notFound();

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-gray-400">Invitation</p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">
          Join {tenant.name}
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          <span className="font-medium text-gray-900">{parsed.email}</span> has been
          invited as {parsed.role}. Choose a password to finish setting up your
          account.
        </p>

        <AcceptInviteForm token={token} email={parsed.email} />
      </div>
    </div>
  );
}
