import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hashToken, parseEmailVerificationIdentifier } from "@/lib/tokens";

export const metadata = {
  title: "Confirm your email",
};

type Outcome = "verified" | "already" | "invalid";

async function verify(token: string): Promise<Outcome> {
  const record = await prisma.verificationToken.findUnique({
    where: { token: hashToken(token) },
  });
  if (!record || record.expires < new Date()) return "invalid";

  const userId = parseEmailVerificationIdentifier(record.identifier);
  if (!userId) return "invalid";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, emailVerifiedAt: true },
  });
  if (!user) return "invalid";

  if (user.emailVerifiedAt) {
    await prisma.verificationToken.delete({ where: { token: hashToken(token) } });
    return "already";
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token: hashToken(token) } }),
  ]);

  return "verified";
}

const COPY: Record<Outcome, { title: string; body: string }> = {
  verified: {
    title: "Email confirmed",
    body: "Thanks — your email address is confirmed. You can sign in to your dashboard.",
  },
  already: {
    title: "Already confirmed",
    body: "This address was confirmed previously. Nothing more to do.",
  },
  invalid: {
    title: "Link expired",
    body: "This confirmation link is invalid or has expired. Sign in and request a new one from your dashboard.",
  },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const outcome: Outcome = token ? await verify(token) : "invalid";
  const copy = COPY[outcome];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">{copy.title}</h1>
        <p className="mt-3 text-sm text-gray-600">{copy.body}</p>
        <Link
          href="/admin/login"
          className="mt-5 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          Go to sign in
        </Link>
      </div>
    </div>
  );
}
