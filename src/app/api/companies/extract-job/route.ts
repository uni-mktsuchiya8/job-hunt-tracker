import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createClient } from "@/lib/supabase/server";
import { fetchHtml, looksLikeChallengePage, resolveSafeUrl } from "@/lib/urlFetch";
import { guessJobFieldsFromText } from "@/lib/jobFieldGuesser";

// Fetches a job-posting page server-side, strips it down to visible text,
// and runs a keyword-based (no AI) guess at salary/location/remote/
// requirements. See src/lib/jobFieldGuesser.ts for the extraction logic
// and src/lib/urlFetch.ts for the SSRF guard.

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
      salary: null,
      workLocation: null,
      remoteType: null,
      jobRequirements: null,
    });
  }

  const $ = cheerio.load(html);
  $("script, style, nav, header, footer, noscript").remove();
  const text = $("body").text().replace(/\n{3,}/g, "\n\n").trim().slice(0, 30_000);

  const guess = guessJobFieldsFromText(text);
  return NextResponse.json(guess);
}
