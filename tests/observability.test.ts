import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { withRetry } from "@/lib/observability";

describe("withRetry", () => {
  beforeEach(() => {
    // Collapse the backoff so the retry path can be exercised instantly.
    vi.spyOn(global, "setTimeout").mockImplementation(((fn: () => void) => {
      fn();
      return 0 as unknown as NodeJS.Timeout;
    }) as typeof setTimeout);
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns immediately when the operation succeeds", async () => {
    const operation = vi.fn().mockResolvedValue("ok");

    await expect(withRetry(operation, { scope: "test" })).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("retries a transient failure and returns the eventual success", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error("network blip"))
      .mockResolvedValue("recovered");

    await expect(withRetry(operation, { scope: "test" })).resolves.toBe("recovered");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("gives up after the attempt limit and rethrows the last error", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("still down"));

    await expect(
      withRetry(operation, { scope: "test", attempts: 3 })
    ).rejects.toThrow("still down");
    expect(operation).toHaveBeenCalledTimes(3);
  });
});
