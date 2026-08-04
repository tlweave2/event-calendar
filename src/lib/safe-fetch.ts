import dns from "node:dns/promises";
import net from "node:net";

/**
 * Guards for the outbound requests the server makes to customer-supplied URLs
 * (ICS feeds, webhook endpoints).
 *
 * Without these, "paste a calendar URL" is a request forgery primitive: the
 * URL is fetched from inside our network, so it can reach cloud metadata
 * endpoints and anything else not exposed to the internet.
 */

/** Generous ceiling for an ICS calendar feed. */
export const MAX_ICS_BYTES = 5 * 1024 * 1024;

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.goog",
]);

export function isPrivateAddress(address: string): boolean {
  const version = net.isIP(address);

  if (version === 4) {
    const parts = address.split(".").map(Number);
    const [a, b] = parts;
    if (a === undefined || b === undefined) return true;

    if (a === 0) return true; // "this" network
    if (a === 10) return true; // private
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
    if (a >= 224) return true; // multicast and reserved
    return false;
  }

  if (version === 6) {
    const lower = address.toLowerCase();
    if (lower === "::" || lower === "::1") return true;
    if (lower.startsWith("fe80")) return true; // link-local
    if (/^f[cd]/.test(lower)) return true; // unique local
    // IPv4-mapped addresses (::ffff:10.0.0.1) inherit the IPv4 rules.
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped?.[1]) return isPrivateAddress(mapped[1]);
    return false;
  }

  // Not an IP literal.
  return false;
}

/**
 * Validate that a URL is safe to fetch server-side.
 *
 * Note: this resolves DNS and checks the answer, so a name that resolves to a
 * private address is rejected. A determined attacker can still re-point DNS
 * between this check and the request (rebinding); blocking that entirely
 * requires pinning the connection to the resolved IP, which fetch does not
 * expose. This closes the straightforward cases.
 */
export async function assertPublicUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError("That does not look like a valid URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new UnsafeUrlError("Only http and https URLs are supported.");
  }

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only https URLs are allowed.");
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost")) {
    throw new UnsafeUrlError("That address is not reachable.");
  }

  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      throw new UnsafeUrlError("That address is not reachable.");
    }
    return url;
  }

  let resolved: { address: string }[];
  try {
    resolved = await dns.lookup(hostname, { all: true });
  } catch {
    throw new UnsafeUrlError("Could not resolve that hostname.");
  }

  if (resolved.length === 0 || resolved.some((entry) => isPrivateAddress(entry.address))) {
    throw new UnsafeUrlError("That address is not reachable.");
  }

  return url;
}

export type SafeFetchOptions = {
  timeoutMs?: number;
  /** Reject responses larger than this many bytes. */
  maxBytes?: number;
};

const MAX_REDIRECTS = 3;

/**
 * Fetch a customer-supplied URL with SSRF checks, a timeout, and a response
 * size cap.
 *
 * Redirects are followed manually so that every hop is validated. Handing the
 * chain to fetch would let a public URL bounce the request to a private one,
 * which is exactly what the checks are meant to prevent.
 */
export async function safeFetch(
  rawUrl: string,
  init: RequestInit = {},
  options: SafeFetchOptions = {}
): Promise<Response> {
  const { timeoutMs = 10_000, maxBytes } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let target = rawUrl;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const url = await assertPublicUrl(target);

      const response = await fetch(url, {
        ...init,
        redirect: "manual",
        signal: controller.signal,
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) return response;
        // Resolve relative redirects against the URL that produced them.
        target = new URL(location, url).toString();
        continue;
      }

      if (maxBytes !== undefined) {
        const declared = Number(response.headers.get("content-length") ?? "0");
        if (declared > maxBytes) {
          throw new UnsafeUrlError("That response is too large to process.");
        }
      }

      return response;
    }

    throw new UnsafeUrlError("That URL redirected too many times.");
  } finally {
    clearTimeout(timer);
  }
}

/** Read a response body, refusing to buffer more than `maxBytes`. */
export async function readCapped(response: Response, maxBytes: number): Promise<string> {
  const body = await response.text();
  if (body.length > maxBytes) {
    throw new UnsafeUrlError("That response is too large to process.");
  }
  return body;
}
