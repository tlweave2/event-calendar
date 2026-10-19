import { afterEach, before, mock, test } from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
let deliverWebhook: typeof import("./webhook").deliverWebhook;
let prisma: typeof import("./prisma").prisma;

before(async () => {
  ({ deliverWebhook } = await import("./webhook"));
  ({ prisma } = await import("./prisma"));
});

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
  mock.restoreAll();
  mock.timers.reset();
  while (restoreStubs.length) restoreStubs.pop()!();
});

// Prisma's model delegates are generated proxies, so swap the whole delegate.
function stubWebhookConfig(findFirst: () => Promise<unknown>) {
  const original = Object.getOwnPropertyDescriptor(prisma, "webhookConfig");
  Object.defineProperty(prisma, "webhookConfig", { value: { findFirst }, configurable: true });
  restoreStubs.push(() => {
    if (original) Object.defineProperty(prisma, "webhookConfig", original);
    else delete (prisma as unknown as Record<string, unknown>).webhookConfig;
  });
}
const restoreStubs: (() => void)[] = [];

function useConfig(url: string) {
  stubWebhookConfig(async () => ({
    id: "w1", tenantId: "t1", url, secret: "s3cret", enabled: true,
    createdAt: new Date(), updatedAt: new Date(),
  }));
}

/** Fake fetch returning the given statuses in order; records each request. */
function useResponses(...statuses: (number | Error)[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  globalThis.fetch = (async (url: string | URL, init: RequestInit) => {
    calls.push({ url: String(url), init });
    const next = statuses[calls.length - 1];
    if (next instanceof Error) throw next;
    return new Response("body", { status: next });
  }) as typeof fetch;
  return calls;
}

/** Run a delivery with retry delays fast-forwarded. */
async function deliver() {
  mock.timers.enable({ apis: ["setTimeout"] });
  const done = deliverWebhook("t1", { type: "event.created", payload: { eventId: "e1" } });
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setImmediate(r));
    mock.timers.tick(10_000);
  }
  await done;
}

// A public IP literal, so no DNS lookup happens in the test.
const HOOK = "https://93.184.216.34/hook";

test("delivers once on success, signed and with an id", async () => {
  useConfig(HOOK);
  const calls = useResponses(200);
  await deliver();
  assert.equal(calls.length, 1);
  const headers = calls[0].init.headers as Record<string, string>;
  assert.match(headers["X-Webhook-Signature"], /^[0-9a-f]{64}$/);
  assert.equal(headers["X-Webhook-Attempt"], "1");
  assert.equal(JSON.parse(String(calls[0].init.body)).event, "event.created");
});

test("retries server errors and network failures, up to 3 attempts, with the same id", async () => {
  useConfig(HOOK);
  const calls = useResponses(503, new Error("ECONNRESET"), 500);
  await deliver();
  assert.equal(calls.length, 3);
  const ids = calls.map((c) => (c.init.headers as Record<string, string>)["X-Webhook-Id"]);
  assert.equal(new Set(ids).size, 1);
  assert.deepEqual(calls.map((c) => (c.init.headers as Record<string, string>)["X-Webhook-Attempt"]), ["1", "2", "3"]);
});

test("stops retrying once a retry succeeds", async () => {
  useConfig(HOOK);
  const calls = useResponses(429, 200);
  await deliver();
  assert.equal(calls.length, 2);
});

test("does not retry client errors", async () => {
  useConfig(HOOK);
  const calls = useResponses(404);
  await deliver();
  assert.equal(calls.length, 1);
});

test("never sends to internal addresses", async () => {
  useConfig("http://169.254.169.254/latest/meta-data/");
  const calls = useResponses(200);
  await deliver();
  assert.equal(calls.length, 0);
});

test("does nothing when no webhook is configured", async () => {
  stubWebhookConfig(async () => null);
  const calls = useResponses(200);
  await deliver();
  assert.equal(calls.length, 0);
});
