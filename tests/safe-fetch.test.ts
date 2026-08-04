import { describe, expect, it } from "vitest";
import { assertPublicUrl, isPrivateAddress, UnsafeUrlError } from "@/lib/safe-fetch";

describe("isPrivateAddress", () => {
  it("flags loopback, private and link-local IPv4", () => {
    for (const address of [
      "127.0.0.1",
      "10.1.2.3",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254", // cloud instance metadata
      "0.0.0.0",
      "100.64.0.1",
    ]) {
      expect(isPrivateAddress(address), address).toBe(true);
    }
  });

  it("allows public IPv4", () => {
    for (const address of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "192.169.0.1"]) {
      expect(isPrivateAddress(address), address).toBe(false);
    }
  });

  it("flags loopback and unique-local IPv6", () => {
    expect(isPrivateAddress("::1")).toBe(true);
    expect(isPrivateAddress("fe80::1")).toBe(true);
    expect(isPrivateAddress("fd00::1")).toBe(true);
    expect(isPrivateAddress("::ffff:169.254.169.254")).toBe(true);
    expect(isPrivateAddress("2606:4700:4700::1111")).toBe(false);
  });
});

describe("assertPublicUrl", () => {
  it("rejects non-http protocols", async () => {
    await expect(assertPublicUrl("file:///etc/passwd")).rejects.toBeInstanceOf(
      UnsafeUrlError
    );
    await expect(assertPublicUrl("gopher://example.org")).rejects.toBeInstanceOf(
      UnsafeUrlError
    );
  });

  it("rejects private and metadata destinations", async () => {
    await expect(assertPublicUrl("http://localhost:3000/x")).rejects.toBeInstanceOf(
      UnsafeUrlError
    );
    await expect(
      assertPublicUrl("http://169.254.169.254/latest/meta-data/")
    ).rejects.toBeInstanceOf(UnsafeUrlError);
    await expect(assertPublicUrl("http://10.0.0.5/internal")).rejects.toBeInstanceOf(
      UnsafeUrlError
    );
    await expect(
      assertPublicUrl("http://metadata.google.internal/computeMetadata/v1/")
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("rejects malformed input", async () => {
    await expect(assertPublicUrl("not a url")).rejects.toBeInstanceOf(UnsafeUrlError);
  });
});
