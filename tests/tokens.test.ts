import { describe, expect, it } from "vitest";
import {
  emailVerificationIdentifier,
  generateToken,
  hashToken,
  inviteIdentifier,
  parseEmailVerificationIdentifier,
  parseInviteIdentifier,
  parsePasswordResetIdentifier,
  passwordResetIdentifier,
  safeCompare,
} from "@/lib/tokens";

describe("token generation", () => {
  it("produces unpredictable, URL-safe tokens", () => {
    const a = generateToken();
    const b = generateToken();

    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(30);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("hashes deterministically and irreversibly", () => {
    const token = generateToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toContain(token);
    expect(hashToken(token)).toHaveLength(64);
  });
});

describe("safeCompare", () => {
  it("matches equal strings and rejects others", () => {
    expect(safeCompare("hunter2", "hunter2")).toBe(true);
    expect(safeCompare("hunter2", "hunter3")).toBe(false);
    // Differing lengths must not throw.
    expect(safeCompare("short", "muchlongervalue")).toBe(false);
  });
});

describe("token identifiers", () => {
  it("round-trips an invite", () => {
    const identifier = inviteIdentifier("tenant-1", "person@example.org", "ADMIN");
    expect(parseInviteIdentifier(identifier)).toEqual({
      tenantId: "tenant-1",
      email: "person@example.org",
      role: "ADMIN",
    });
  });

  it("round-trips password reset and verification identifiers", () => {
    expect(parsePasswordResetIdentifier(passwordResetIdentifier("user-1"))).toBe("user-1");
    expect(parseEmailVerificationIdentifier(emailVerificationIdentifier("user-1"))).toBe(
      "user-1"
    );
  });

  it("refuses to redeem one token type as another", () => {
    // A password reset token must never satisfy an invite lookup.
    expect(parseInviteIdentifier(passwordResetIdentifier("user-1"))).toBeNull();
    expect(parsePasswordResetIdentifier(inviteIdentifier("t", "e@x.co", "OWNER"))).toBeNull();
    expect(parseEmailVerificationIdentifier(passwordResetIdentifier("user-1"))).toBeNull();
  });
});
