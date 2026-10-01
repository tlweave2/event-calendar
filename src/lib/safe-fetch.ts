import { lookup } from "dns/promises";
import { BlockList, isIP } from "net";

// Guards server-side requests to URLs that tenants type in (webhook
// endpoints, calendar feeds) so they can't be pointed at our own
// infrastructure: localhost, the cloud metadata service, private networks.

const blocked = new BlockList();
for (const [net, prefix] of [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, incl. cloud metadata 169.254.169.254
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, incl. broadcast
] as const) {
  blocked.addSubnet(net, prefix, "ipv4");
}
for (const [net, prefix] of [
  ["::", 128], // unspecified
  ["::1", 128], // loopback
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["ff00::", 8], // multicast
] as const) {
  blocked.addSubnet(net, prefix, "ipv6");
}

/** IPv4 address embedded in an IPv4-mapped (::ffff:a.b.c.d) or NAT64 (64:ff9b::a.b.c.d) IPv6 address. */
function embeddedIpv4(ip: string): string | null {
  const m = ip.toLowerCase().match(/^(?:::ffff:|64:ff9b::)(\d+\.\d+\.\d+\.\d+)$/);
  return m ? m[1] : null;
}

export function isPublicIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return !blocked.check(ip, "ipv4");
  if (version === 6) {
    const v4 = embeddedIpv4(ip);
    if (v4) return isPublicIp(v4);
    return !blocked.check(ip, "ipv6");
  }
  return false;
}

export class UnsafeUrlError extends Error {}

export const UNSAFE_URL_MESSAGE =
  "That address points to a private or internal network, which isn't allowed. Use a public http(s) URL.";

type Resolver = (hostname: string) => Promise<string[]>;

const defaultResolver: Resolver = async (hostname) =>
  (await lookup(hostname, { all: true, verbatim: true })).map((r) => r.address);

/**
 * Throws UnsafeUrlError unless the URL is http(s) and every address its host
 * resolves to is public.
 */
export async function assertPublicUrl(raw: string | URL, resolve: Resolver = defaultResolver): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("Invalid URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new UnsafeUrlError(`Unsupported protocol ${url.protocol}`);
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError("URLs with embedded credentials aren't allowed");
  }

  const host = url.hostname.replace(/^\[|\]$/g, "");
  let addresses: string[];
  if (isIP(host)) {
    addresses = [host];
  } else {
    try {
      addresses = await resolve(host);
    } catch {
      throw new UnsafeUrlError(`Could not resolve ${host}`);
    }
  }
  if (addresses.length === 0 || !addresses.every(isPublicIp)) {
    throw new UnsafeUrlError(`${host} resolves to a non-public address`);
  }
  return url;
}

/** True when the URL is safe to fetch; for form validation. */
export async function isPublicUrl(raw: string): Promise<boolean> {
  try {
    await assertPublicUrl(raw);
    return true;
  } catch {
    return false;
  }
}

const MAX_REDIRECTS = 3;

/**
 * fetch() for tenant-supplied URLs. Every hop is checked with
 * assertPublicUrl, so a public URL can't redirect us somewhere internal.
 * Redirects are only followed for GET/HEAD; other methods treat them as the
 * final response.
 */
export async function safeFetch(raw: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const followRedirects = method === "GET" || method === "HEAD";
  let current = raw;

  for (let hop = 0; ; hop++) {
    const url = await assertPublicUrl(current);
    const res = await fetch(url, { ...init, redirect: "manual" });
    const location = res.headers.get("location");
    if (!followRedirects || res.status < 300 || res.status >= 400 || !location) return res;
    if (hop >= MAX_REDIRECTS) throw new UnsafeUrlError("Too many redirects");
    current = new URL(location, url).toString();
  }
}
