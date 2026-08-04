import { can, requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantUsers } from "@/lib/prisma-tenant";
import InviteForm from "./InviteForm";
import BillingSection from "./BillingSection";
import { GoogleCalendarFormClient, WebhookSettingsFormClient } from "./SettingsFormsSsr";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requirePermission("settings:write");

  // Guard against corrupted/old sessions that lack tenantId
  const tenantId = session.tenantId;
  if (!tenantId) redirect("/admin/login");

  const sp = await searchParams;

  let tenant = null;
  try {
    tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  } catch (err) {
    console.error("[settings] tenant query failed:", err);
  }

  let users: Array<{ id: string; email: string; role: string }> = [];
  try {
    users = await getTenantUsers(tenantId);
  } catch (err) {
    console.error("[settings] users query failed:", err);
  }

  let webhookConfig = null;
  try {
    webhookConfig = await prisma.webhookConfig.findUnique({ where: { tenantId } });
  } catch {
    // Table may not exist yet or other transient error
  }

  const inviteSuccess = sp.invited === "1";
  const inviteError = typeof sp.invite_error === "string" ? sp.invite_error : null;
  const billingError = typeof sp.billing_error === "string" ? sp.billing_error : null;

  const canManageUsers = can(session.role, "users:manage");
  const canManageBilling = can(session.role, "billing:manage");

  return (
    <div className="max-w-5xl px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Invite collaborators and review access.</p>
      </div>

      {inviteSuccess && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          Invite sent successfully.
        </div>
      )}
      {inviteError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {inviteError}
        </div>
      )}
      {billingError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {billingError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Team and billing changes are owner-only; the actions enforce this
            too, this just keeps the UI honest about it. */}
        {canManageUsers ? (
          <InviteForm />
        ) : (
          <div className="rounded-lg border bg-white p-5 text-sm text-gray-500">
            Only workspace owners can invite or remove teammates.
          </div>
        )}
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

      {tenant && canManageBilling && (
        <div className="mt-6 max-w-2xl">
          <p className="mb-2 text-sm text-gray-500">
            Your plan determines how many events you can receive each month and
            which features are available.
          </p>
          <BillingSection plan={tenant.plan} hasStripeCustomer={!!tenant.stripeCustomerId} />
        </div>
      )}

      <div className="mt-6 max-w-2xl">
        <GoogleCalendarFormClient initialIcsUrl={tenant?.googleCalendarIcsUrl ?? ""} />
      </div>

      <div className="mt-6 max-w-2xl">
        <WebhookSettingsFormClient
          initialUrl={webhookConfig?.url ?? ""}
          initialEnabled={webhookConfig?.enabled ?? false}
        />
      </div>
    </div>
  );
}
