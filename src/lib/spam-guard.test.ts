import { before, test } from "node:test";
import assert from "node:assert/strict";

// spam-guard imports the Prisma client, which needs a connection string at
// import time (it doesn't connect until queried).
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
let checkFormToken: typeof import("./spam-guard").checkFormToken;
let createFormToken: typeof import("./spam-guard").createFormToken;
let hashKey: typeof import("./spam-guard").hashKey;
before(async () => {
  ({ checkFormToken, createFormToken, hashKey } = await import("./spam-guard"));
});

const t0 = 1_800_000_000_000;

test("form token is accepted after a few seconds", () => {
  const token = createFormToken("tenant-a", t0);
  assert.equal(checkFormToken(token, "tenant-a", t0 + 10_000), "ok");
});

test("form token submitted too quickly is flagged", () => {
  const token = createFormToken("tenant-a", t0);
  assert.equal(checkFormToken(token, "tenant-a", t0 + 1_000), "too_fast");
});

test("form token expires after a day", () => {
  const token = createFormToken("tenant-a", t0);
  assert.equal(checkFormToken(token, "tenant-a", t0 + 25 * 60 * 60 * 1000), "expired");
});

test("form token can't be reused for another calendar or tampered with", () => {
  const token = createFormToken("tenant-a", t0);
  const [, sig] = token.split(".");
  assert.equal(checkFormToken(token, "tenant-b", t0 + 10_000), "invalid");
  assert.equal(checkFormToken(`${t0 - 60_000}.${sig}`, "tenant-a", t0 + 10_000), "invalid");
  assert.equal(checkFormToken("garbage", "tenant-a", t0), "invalid");
  assert.equal(checkFormToken(undefined, "tenant-a", t0), "invalid");
});

test("hashKey is stable, case-insensitive and doesn't contain the input", () => {
  assert.equal(hashKey("Someone@Example.com "), hashKey("someone@example.com"));
  assert.notEqual(hashKey("a@example.com"), hashKey("b@example.com"));
  assert.ok(!hashKey("someone@example.com").includes("someone"));
  assert.equal(hashKey("x").length, 64);
});
