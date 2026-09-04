import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import * as cheerio from "cheerio";
import { createClient } from "@/lib/supabase/server";

// Fetches a company's website server-side and pulls a best-guess company
// name + short description out of its <title> / OGP meta tags. Requires
// login and blocks requests to private/internal addresses, since this
// route lets the server fetch an arbitrary URL on the caller's behalf
// (an open URL-fetch proxy is an SSRF risk once this app is deployed
// somewhere reachable by more than one person).

function isPrivateIp(ip: string): boolean {
  if (ip.includes(":")) {
    // IPv6: loopback, link-local, unique-local
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

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url")?.trim();
  if (!rawUrl) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  try {
    const { address } = await lookup(target.hostname);
    if (isPrivateIp(address)) {
      return NextResponse.json({ error: "invalid url" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "could not resolve host" }, {
      status: 400,
    });
  }

  try {
    const res = await fetch(target, {
      signal: AbortSignal.timeout(6000),
      redirect: "follow",
      headers: {
        // A generic bot UA gets blocked by a fair number of corporate
        // sites; a normal browser UA (this is a one-off lookup a logged-in
        // user triggered for their own use, not bulk scraping) is far more
        // reliable.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "fetch failed" }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) {
      return NextResponse.json({ error: "not an html page" }, { status: 415 });
    }

    // Cap how much we read — we only need the <head>.
    const buffer = await res.arrayBuffer();
    const html = new TextDecoder("utf-8").decode(
      buffer.byteLength > 500_000 ? buffer.slice(0, 500_000) : buffer,
    );

    // Bot-protection challenge pages (Cloudflare, etc.) return 200 with a
    // real-looking <title> like "Just a moment..." — extracting that as
    // the company name would be actively wrong, not just unhelpful, so
    // bail out before trying.
    const CHALLENGE_MARKERS = [
      /just a moment/i,
      /attention required/i,
      /cf-browser-verification/i,
      /enable javascript and cookies to continue/i,
      /checking your browser/i,
    ];
    if (CHALLENGE_MARKERS.some((re) => re.test(html))) {
      return NextResponse.json({ name: null, description: null });
    }

    const $ = cheerio.load(html);
    const ogSiteName = $('meta[property="og:site_name"]').attr("content")?.trim();
    const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
    const title = $("title").first().text().trim();
    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";

    // og:site_name is *usually* the cleanest source, but some sites stuff a
    // copyright notice or a tagline in there instead of a plain name (e.g.
    // "(c) Recruit Co., Ltd." or a long slogan) — fall through past it when
    // it looks like that.
    const looksLikeBadSiteName = (s: string) =>
      /[©(（]c[)）]|copyright/i.test(s) || s.length > 40;

    let name = "";
    if (ogSiteName && !looksLikeBadSiteName(ogSiteName)) {
      name = ogSiteName;
    } else if (ogTitle) {
      name = ogTitle;
    } else if (title) {
      name = title;
    } else if (ogSiteName) {
      name = ogSiteName;
    }

    // Japanese sites conventionally put the company name first, e.g.
    // "会社名 | キャッチコピー" — take the first segment. English titles
    // are more often the reverse ("Page - Site Name"), so we only split on
    // "|"/"｜" (unambiguous either way) and not on "-"/"–"/"—", which would
    // as often cut off the real name as keep it.
    if (name && name !== ogSiteName) {
      const parts = name.split(/\s*[|｜]\s*/);
      if (parts[0]) name = parts[0].trim();
    }

    // Strip a trailing "公式サイト" / "コーポレートサイト"-style label —
    // common on Japanese corporate sites and never part of the actual name.
    const TRAILING_NOISE = [
      "公式企業サイト",
      "公式サイト",
      "公式ホームページ",
      "オフィシャルサイト",
      "コーポレートサイト",
    ];
    for (const noise of TRAILING_NOISE) {
      if (name.endsWith(` ${noise}`) || name.endsWith(`　${noise}`)) {
        name = name.slice(0, name.length - noise.length).trim();
        break;
      }
    }

    return NextResponse.json({
      name: name || null,
      description: description ? description.trim() : null,
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }
}
