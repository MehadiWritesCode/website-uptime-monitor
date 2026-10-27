import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local, cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast / reserved / broadcast
  );
}

function isPrivateIPv6(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v === "::" || v === "::1") return true;
  if (v.startsWith("::ffff:")) {
    const mapped = v.slice(7);
    return isIP(mapped) === 4 ? isPrivateIPv4(mapped) : true;
  }
  return /^(fc|fd|fe8|fe9|fea|feb)/.test(v); // unique-local + link-local
}

/** Throws unless the URL is http(s) and resolves only to public addresses. */
export async function assertPublicUrl(raw: string): Promise<URL> {
  const url = new URL(raw);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed");
  }
  if (url.username || url.password) {
    throw new Error("URLs with credentials are not allowed");
  }

  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new Error("Local hostnames are not allowed");
  }

  const addresses = isIP(host)
    ? [{ address: host }]
    : await lookup(host, { all: true });

  for (const { address } of addresses) {
    const blocked =
      isIP(address) === 4 ? isPrivateIPv4(address) : isPrivateIPv6(address);
    if (blocked)
      throw new Error("Target resolves to a private or reserved address");
  }

  return url;
}
