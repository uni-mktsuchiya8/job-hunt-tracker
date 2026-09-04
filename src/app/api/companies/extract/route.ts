import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createClient } from "@/lib/supabase/server";
import { fetchHtml, looksLikeChallengePage, resolveSafeUrl } from "@/lib/urlFetch";

// Fetches a company's website server-side and pulls a best-guess company
// name + description out of its <title>/OGP meta tags and any JSON-LD
// Organization data. Requires login and blocks requests to private/internal
// addresses — see src/lib/urlFetch.ts.

function extractJsonLdOrganization(
  $: cheerio.CheerioAPI,
): { name?: string; description?: string; address?: string } | null {
  const scripts = $('script[type="application/ld+json"]');
  for (const el of scripts.toArray()) {
    const raw = $(el).text();
    if (!raw?.trim()) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      const obj = node as Record<string, unknown>;
      const type = obj["@type"];
      const types = Array.isArray(type) ? type : [type];
      if (
        !types.some(
          (t) =>
            typeof t === "string" &&
            /organization|corporation|localbusiness/i.test(t),
        )
      ) {
        continue;
      }
      const address = obj.address as Record<string, unknown> | undefined;
      const addressStr =
        address && typeof address === "object"
          ? [
              address.postalCode,
              address.addressRegion,
              address.addressLocality,
              address.streetAddress,
            ]
              .filter((v): v is string => typeof v === "string" && v.length > 0)
              .join(" ")
          : undefined;
      return {
        name: typeof obj.name === "string" ? obj.name : undefined,
        description:
          typeof obj.description === "string" ? obj.description : undefined,
        address: addressStr,
      };
    }
  }
  return null;
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

  const safe = await resolveSafeUrl(rawUrl);
  if (!safe.ok) {
    return NextResponse.json({ error: safe.error }, { status: safe.status });
  }

  const fetched = await fetchHtml(safe.url);
  if (!fetched.ok) {
    return NextResponse.json({ error: fetched.error }, { status: fetched.status });
  }
  const { html } = fetched;

  if (looksLikeChallengePage(html)) {
    return NextResponse.json({ name: null, description: null });
  }

  const $ = cheerio.load(html);
  const ogSiteName = $('meta[property="og:site_name"]').attr("content")?.trim();
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  const title = $("title").first().text().trim();
  const metaDescription =
    $('meta[property="og:description"]').attr("content")?.trim() ||
    $('meta[name="description"]').attr("content")?.trim() ||
    "";

  const jsonLd = extractJsonLdOrganization($);

  // og:site_name is *usually* the cleanest source, but some sites stuff a
  // copyright notice or a tagline in there instead of a plain name (e.g.
  // "(c) Recruit Co., Ltd." or a long slogan) — fall through past it when
  // it looks like that.
  const looksLikeBadSiteName = (s: string) =>
    /[©(（]c[)）]|copyright/i.test(s) || s.length > 40;

  let name = "";
  if (jsonLd?.name && !looksLikeBadSiteName(jsonLd.name)) {
    name = jsonLd.name;
  } else if (ogSiteName && !looksLikeBadSiteName(ogSiteName)) {
    name = ogSiteName;
  } else if (ogTitle) {
    name = ogTitle;
  } else if (title) {
    name = title;
  } else if (ogSiteName) {
    name = ogSiteName;
  } else if (jsonLd?.name) {
    name = jsonLd.name;
  }

  // Japanese sites conventionally put the company name first, e.g.
  // "会社名 | キャッチコピー" — take the first segment. English titles
  // are more often the reverse ("Page - Site Name"), so we only split on
  // "|"/"｜" (unambiguous either way) and not on "-"/"–"/"—", which would
  // as often cut off the real name as keep it.
  if (name && name !== ogSiteName && name !== jsonLd?.name) {
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

  // Prefer the richer of the two descriptions (JSON-LD org descriptions
  // tend to be a proper paragraph; meta description is often a thin SEO
  // snippet). Fold the address in as a bonus line when we have one.
  const descriptionParts = [
    jsonLd?.description && jsonLd.description.length > metaDescription.length
      ? jsonLd.description
      : metaDescription || jsonLd?.description,
    jsonLd?.address ? `所在地: ${jsonLd.address}` : null,
  ].filter((v): v is string => !!v?.trim());

  return NextResponse.json({
    name: name || null,
    description: descriptionParts.length ? descriptionParts.join("\n") : null,
  });
}
