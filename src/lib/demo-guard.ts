export const DEMO_LOCK_MESSAGE =
  "Editing is disabled in demo mode. Sign up to create your own calendar!";

export function isDemoTenant(tenantId: string, slug?: string | null): boolean {
  void tenantId;
  return slug === "demo";
}

export function demoFormError(): { success: false; errors: { _form: string[] } } {
  return { success: false, errors: { _form: [DEMO_LOCK_MESSAGE] } };
}
