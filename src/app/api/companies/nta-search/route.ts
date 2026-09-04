import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

// Proxies the National Tax Agency's 法人番号 (Corporate Number) Web-API
// name-search. Requires NTA_APPLICATION_ID (see README for how to get a
// free one). Returns official, registered Japanese company names/addresses
// — no website URL (the registry doesn't have one), so this is a separate,
// more authoritative source from the Clearbit-based /websearch route,
// which is the one that can supply a website guess.
export async function GET(request: Request) {
  const appId = process.env.NTA_APPLICATION_ID;
  if (!appId) {
    return NextResponse.json({ results: [], configured: false });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ results: [], configured: true });
  }

  const url = new URL("https://api.houjin-bangou.nta.go.jp/4/name");
  url.searchParams.set("id", appId);
  url.searchParams.set("name", query);
  url.searchParams.set("type", "12"); // XML/Unicode — the API has no JSON mode
  url.searchParams.set("mode", "0"); // 部分一致検索 (substring match)
  url.searchParams.set("target", "1"); // 商号_検索用 (normalized search name)

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      // 400 with no results (e.g. name too short) is common and not an error
      // worth surfacing — just return nothing.
      return NextResponse.json({ results: [], configured: true });
    }
    const xml = await res.text();
    const parser = new XMLParser();
    const parsed = parser.parse(xml);

    const rawCorporations = parsed?.corporations?.corporation ?? [];
    const corporations = Array.isArray(rawCorporations)
      ? rawCorporations
      : [rawCorporations];

    const results = corporations
      .filter((c) => c && c.name)
      .slice(0, 8)
      .map((c) => ({
        corporateNumber: String(c.corporateNumber ?? ""),
        name: String(c.name ?? ""),
        prefecture: c.prefectureName ? String(c.prefectureName) : "",
        city: c.cityName ? String(c.cityName) : "",
        streetNumber: c.streetNumber ? String(c.streetNumber) : "",
      }));

    return NextResponse.json({ results, configured: true });
  } catch {
    return NextResponse.json({ results: [], configured: true });
  }
}
