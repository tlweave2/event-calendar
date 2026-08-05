/**
 * Error reporting and structured logging.
 *
 * Before this, every failure was a bare `console.error` in a serverless log
 * nobody reads — a customer's webhook could fail for weeks in silence. These
 * helpers give failures a consistent shape and a place to go.
 *
 * Sentry is used when SENTRY_DSN is set. Without it, everything still emits
 * structured JSON, which is greppable and picked up by any log drain.
 */

type Level = "info" | "warn" | "error";

export type ErrorContext = {
  /** Where this happened, e.g. "webhook.deliver" or "stripe.invoice". */
  scope: string;
  tenantId?: string;
  userId?: string;
  [key: string]: unknown;
};

type SentryLike = {
  captureException: (err: unknown, hint?: { extra?: Record<string, unknown> }) => void;
  captureMessage: (message: string, level?: string) => void;
};

let sentry: SentryLike | null = null;
let sentryLoaded = false;

async function getSentry(): Promise<SentryLike | null> {
  if (sentryLoaded) return sentry;
  sentryLoaded = true;

  if (!process.env.SENTRY_DSN) return null;

  try {
    // Imported lazily so a deployment without Sentry configured never pays for
    // loading it.
    const mod = (await import("@sentry/nextjs")) as unknown as SentryLike;
    sentry = mod;
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "warn",
        scope: "observability",
        message: "SENTRY_DSN is set but @sentry/nextjs failed to load",
        error: String(err),
      })
    );
    sentry = null;
  }

  return sentry;
}

function emit(level: Level, payload: Record<string, unknown>) {
  const line = JSON.stringify({
    level,
    timestamp: new Date().toISOString(),
    ...payload,
  });

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

function serializeError(err: unknown) {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { message: String(err) };
}

/** Report a failure. Never throws — reporting must not break the caller. */
export async function captureError(err: unknown, context: ErrorContext): Promise<void> {
  try {
    emit("error", { ...context, error: serializeError(err) });

    const client = await getSentry();
    client?.captureException(err, { extra: context });
  } catch (reportingError) {
    console.error("[observability] failed to report error:", reportingError);
  }
}

/** Report something noteworthy that is not an exception. */
export async function captureWarning(
  message: string,
  context: ErrorContext
): Promise<void> {
  try {
    emit("warn", { ...context, message });

    const client = await getSentry();
    client?.captureMessage(message, "warning");
  } catch (reportingError) {
    console.error("[observability] failed to report warning:", reportingError);
  }
}

export function logInfo(message: string, context: Partial<ErrorContext> = {}): void {
  emit("info", { ...context, message });
}

/**
 * Retry an operation with exponential backoff and jitter.
 *
 * Used for outbound calls we do not control (customer webhook endpoints, the
 * mail provider), where a single transient failure should not lose the
 * message.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: { attempts?: number; baseDelayMs?: number; scope: string }
): Promise<T> {
  const { attempts = 3, baseDelayMs = 500, scope } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (attempt === attempts) break;

      const delay = baseDelayMs * 2 ** (attempt - 1) + Math.random() * 250;
      emit("warn", {
        scope,
        message: `attempt ${attempt} of ${attempts} failed, retrying`,
        retryInMs: Math.round(delay),
        error: serializeError(err),
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
