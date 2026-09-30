import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { acceptInvite } from "@/lib/actions/accept-invite";
import AuthShell from "@/components/AuthShell";

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
    <AuthShell
      title="You’ve been invited"
      subtitle={
        <>
          <span className="font-medium text-gray-900">{email}</span> is invited to help
          manage this calendar as {roleHint === "editor" ? "an editor" : roleHint === "owner" ? "an owner" : "an admin"}.
        </>
      }
    >
      <form action={acceptInvite.bind(null, { token })}>
        <button className="w-full rounded bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700">
          Accept invitation
        </button>
      </form>
    </AuthShell>
  );
}