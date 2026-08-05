/**
 * Server-side error reporting.
 *
 * Initialised only when SENTRY_DSN is set, so a deployment without Sentry
 * configured behaves exactly as before and pays nothing for the SDK.
 */
export async function register() {
  if (!process.env.SENTRY_DSN) return;

  const Sentry = await import("@sentry/nextjs");

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    // Traces are sampled lightly: this is an error reporter first, and a
    // performance tool a distant second.
    tracesSampleRate: 0.1,
    // Event payloads can carry submitter names and addresses.
    sendDefaultPii: false,
  });
}

export async function onRequestError(
  ...args: Parameters<
    NonNullable<Awaited<ReturnType<typeof getSentryRequestErrorHandler>>>
  >
) {
  const handler = await getSentryRequestErrorHandler();
  handler?.(...args);
}

async function getSentryRequestErrorHandler() {
  if (!process.env.SENTRY_DSN) return null;
  const Sentry = await import("@sentry/nextjs");
  return Sentry.captureRequestError;
}
