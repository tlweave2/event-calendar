import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantUsers } from "@/lib/prisma-tenant";
import InviteForm from "./InviteForm";
import BillingSection from "./BillingSection";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId } });
  const users = await getTenantUsers(session.user.tenantId);

  return (
    <div className="max-w-5xl px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Invite collaborators and review access.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <InviteForm />
        <div className="rounded-lg border bg-white p-5">
          <h2 className="font-semibold text-gray-900">Current users</h2>
          <div className="mt-4 space-y-3 text-sm">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
                <div>
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <p className="text-xs uppercase tracking-wide text-gray-400">{user.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tenant && (
        <div className="mt-6 max-w-2xl">
          <BillingSection plan={tenant.plan} hasStripeCustomer={!!tenant.stripeCustomerId} />
        </div>
      )}
    </div>
  );
}