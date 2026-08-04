/**
 * Absolute base URL for links that leave the app (emails, Stripe redirects).
 *
 * NEXTAUTH_URL is the canonical value. Vercel sets VERCEL_URL on preview
 * deployments where NEXTAUTH_URL is usually absent, so fall back to it before
 * giving up and assuming local development.
 */
export function getAppBaseUrl(): string {
  const configured = process.env.NEXTAUTH_URL ?? process.env.APP_URL;
  if (configured) return configured.replace(/\/$/, "");

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}
