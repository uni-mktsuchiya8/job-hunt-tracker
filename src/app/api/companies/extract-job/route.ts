import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createClient } from "@/lib/supabase/server";
import { fetchHtml, looksLikeChallengePage, resolveSafeUrl } from "@/lib/urlFetch";
import { guessJobFieldsFromText, type JobFieldGuess } from "@/lib/jobFieldGuesser";

// Fetches a job-posting page server-side, strips it down to visible text,
// and runs a keyword-based (no AI) guess at company name/salary/location/
// remote/requirements. See src/lib/jobFieldGuesser.ts for that logic and
// src/lib/urlFetch.ts for the SSRF guard.
//
// Many job boards also embed schema.org/JobPosting structured data for SEO
// — when present it's far more reliable than keyword scanning, so we parse
// it and let it override the keyword guess field-by-field.

function extractJsonLdJobPosting($: cheerio.CheerioAPI): Partial<JobFieldGuess> {
  const result: Partial<JobFieldGuess> = {};
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
      if (!types.some((t) => typeof t === "string" && /jobposting/i.test(t))) {
        continue;
      }

      const org = obj.hiringOrganization as Record<string, unknown> | undefined;
      if (org && typeof org.name === "string" && org.name.trim()) {
        result.companyName = org.name.trim();
      }

      const salaryObj = obj.baseSalary as Record<string, unknown> | undefined;
      const salaryValue = salaryObj?.value as Record<string, unknown> | undefined;
      if (salaryValue) {
        const currency =
          typeof salaryObj?.currency === "string" ? salaryObj.currency : "";
        const unit = typeof salaryValue.unitText === "string" ? salaryValue.unitText : "";
        if (typeof salaryValue.minValue === "number" && typeof salaryValue.maxValue === "number") {
          result.salary = `${salaryValue.minValue}〜${salaryValue.maxValue} ${currency}${unit ? `/${unit}` : ""}`.trim();
        } else if (typeof salaryValue.value === "number") {
          result.salary = `${salaryValue.value} ${currency}${unit ? `/${unit}` : ""}`.trim();
        }
      }

      const location = obj.jobLocation as Record<string, unknown> | undefined;
      const address = (Array.isArray(location) ? location[0] : location)
        ?.address as Record<string, unknown> | undefined;
      if (address) {
        const parts = [
          address.addressRegion,
          address.addressLocality,
          address.streetAddress,
        ].filter((v): v is string => typeof v === "string" && v.length > 0);
        if (parts.length) result.workLocation = parts.join(" ");
      }

      const jobLocationType = obj.jobLocationType;
      if (jobLocationType === "TELECOMMUTE") {
        result.remoteType = "5";
      }

      // First match wins — most postings only have one JobPosting node.
      return result;
    }
  }
  return result;
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

  const fetched = await fetchHtml(safe.url, 1_500_000);
  if (!fetched.ok) {
    return NextResponse.json({ error: fetched.error }, { status: fetched.status });
  }
  const { html } = fetched;

  if (looksLikeChallengePage(html)) {
    return NextResponse.json({
      companyName: null,
      salary: null,
      workLocation: null,
      remoteType: null,
      jobRequirements: null,
    } satisfies JobFieldGuess);
  }

  const $ = cheerio.load(html);
  const structured = extractJsonLdJobPosting($);

  $("script, style, nav, header, footer, noscript").remove();
  const text = $("body").text().replace(/\n{3,}/g, "\n\n").trim().slice(0, 30_000);
  const keywordGuess = guessJobFieldsFromText(text);

  // Structured data wins per-field when present; keyword scan fills the rest.
  const guess: JobFieldGuess = {
    companyName: structured.companyName ?? keywordGuess.companyName,
    salary: structured.salary ?? keywordGuess.salary,
    workLocation: structured.workLocation ?? keywordGuess.workLocation,
    remoteType: structured.remoteType ?? keywordGuess.remoteType,
    jobRequirements: keywordGuess.jobRequirements,
  };

  return NextResponse.json(guess);
}
