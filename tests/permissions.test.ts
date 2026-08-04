import { describe, expect, it } from "vitest";
import { can, PERMISSIONS } from "@/lib/permissions";

describe("role permissions", () => {
  it("lets owners do everything", () => {
    for (const permission of Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[]) {
      expect(can("OWNER", permission)).toBe(true);
    }
  });

  it("keeps editors out of settings, billing and team management", () => {
    expect(can("EDITOR", "events:write")).toBe(true);
    expect(can("EDITOR", "events:moderate")).toBe(true);

    expect(can("EDITOR", "events:delete")).toBe(false);
    expect(can("EDITOR", "settings:write")).toBe(false);
    expect(can("EDITOR", "billing:manage")).toBe(false);
    expect(can("EDITOR", "users:manage")).toBe(false);
  });

  it("keeps admins out of billing and team management", () => {
    expect(can("ADMIN", "settings:write")).toBe(true);
    expect(can("ADMIN", "events:delete")).toBe(true);
    expect(can("ADMIN", "events:export")).toBe(true);

    expect(can("ADMIN", "billing:manage")).toBe(false);
    expect(can("ADMIN", "users:manage")).toBe(false);
  });
});
