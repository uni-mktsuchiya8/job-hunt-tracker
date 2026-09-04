import { lookup } from "node:dns/promises";

// Shared helpers for server-side "fetch a URL the user gave us" routes
// (/api/companies/extract, /api/companies/extract-job). Centralizes the
// SSRF guard and bot-challenge detection so both routes stay consistent.

export function isPrivateIp(ip: string): boolean {
  if (ip.includes(":")) {
    const lower = ip.toLowerCase();
    return (
      lower === "::1" ||
      lower.startsWith("fe80:") ||
      lower.startsWith("fc") ||
      lower.startsWith("fd")
    );
  }
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  if (a === 127) return true; // loopback
  if (a === 10) return true; // private
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 0) return true;
  return false;
}

export type SafeUrlResult =
  | { ok: true; url: URL }
  | { ok: false; error: string; status: number };

export async function resolveSafeUrl(rawUrl: string): Promise<SafeUrlResult> {
  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return { ok: false, error: "invalid url", status: 400 };
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return { ok: false, error: "invalid url", status: 400 };
  }
  try {
    const { address } = await lookup(target.hostname);
    if (isPrivateIp(address)) {
      return { ok: false, error: "invalid url", status: 400 };
    }
  } catch {
    return { ok: false, error: "could not resolve host", status: 400 };
  }
  return { ok: true, url: target };
}

// A generic bot UA gets blocked by a fair number of corporate sites; a
// normal browser UA (this is a one-off lookup a logged-in user triggered
// for their own use, not bulk scraping) is far more reliable.
export const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

// Bot-protection challenge pages (Cloudflare, etc.) return 200 with a
// real-looking <title> like "Just a moment..." — extracting that as real
// content would be actively wrong, not just unhelpful.
const CHALLENGE_MARKERS = [
  /just a moment/i,
  /attention required/i,
  /cf-browser-verification/i,
  /enable javascript and cookies to continue/i,
  /checking your browser/i,
];

export function looksLikeChallengePage(html: string): boolean {
  return CHALLENGE_MARKERS.some((re) => re.test(html));
}

export type FetchHtmlResult =
  | { ok: true; html: string }
  | { ok: false; error: string; status: number };

export async function fetchHtml(
  target: URL,
  maxBytes = 700_000,
): Promise<FetchHtmlResult> {
  try {
    const res = await fetch(target, {
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
      headers: { "User-Agent": BROWSER_USER_AGENT },
    });
    if (!res.ok) return { ok: false, error: "fetch failed", status: 502 };

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) {
      return { ok: false, error: "not an html page", status: 415 };
    }

    const buffer = await res.arrayBuffer();
    const html = new TextDecoder("utf-8").decode(
      buffer.byteLength > maxBytes ? buffer.slice(0, maxBytes) : buffer,
    );
    return { ok: true, html };
  } catch {
    return { ok: false, error: "fetch failed", status: 502 };
  }
}
