import { test } from "node:test";
import assert from "node:assert/strict";
import { UnsafeUrlError, assertPublicUrl, isPublicIp } from "./safe-fetch";

test("isPublicIp blocks private, loopback, link-local and metadata addresses", () => {
  for (const ip of [
    "127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1",
    "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "255.255.255.255",
    "::1", "::", "fc00::1", "fd12:3456::1", "fe80::1", "ff02::1",
    "::ffff:127.0.0.1", "::ffff:169.254.169.254", "64:ff9b::10.0.0.1",
  ]) {
    assert.equal(isPublicIp(ip), false, ip);
  }
});

test("isPublicIp allows ordinary public addresses", () => {
  for (const ip of ["8.8.8.8", "142.250.72.14", "172.32.0.1", "2607:f8b0:4005::200e", "::ffff:8.8.8.8"]) {
    assert.equal(isPublicIp(ip), true, ip);
  }
});

test("isPublicIp rejects things that aren't IPs", () => {
  assert.equal(isPublicIp("localhost"), false);
  assert.equal(isPublicIp(""), false);
});

const resolver = (map: Record<string, string[]>) => async (host: string) => {
  if (!(host in map)) throw new Error("ENOTFOUND");
  return map[host];
};

test("assertPublicUrl accepts public http(s) URLs", async () => {
  const r = resolver({ "hooks.example.com": ["93.184.216.34"] });
  assert.equal((await assertPublicUrl("https://hooks.example.com/x", r)).hostname, "hooks.example.com");
  assert.ok(await assertPublicUrl("http://8.8.8.8/feed.ics", r));
});

test("assertPublicUrl rejects internal targets", async () => {
  const r = resolver({
    "internal.example.com": ["10.0.0.5"],
    "mixed.example.com": ["93.184.216.34", "127.0.0.1"],
    localhost: ["127.0.0.1", "::1"],
  });
  for (const url of [
    "http://127.0.0.1/",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::1]:3000/",
    "http://localhost:5432/",
    "https://internal.example.com/hook",
    "https://mixed.example.com/hook", // any private answer is enough to refuse
    "https://doesnotresolve.example.com/",
  ]) {
    await assert.rejects(assertPublicUrl(url, r), UnsafeUrlError, url);
  }
});

test("assertPublicUrl rejects other protocols and embedded credentials", async () => {
  const r = resolver({ "example.com": ["93.184.216.34"] });
  for (const url of ["file:///etc/passwd", "ftp://example.com/x", "https://user:pw@example.com/", "not a url"]) {
    await assert.rejects(assertPublicUrl(url, r), UnsafeUrlError, url);
  }
});
