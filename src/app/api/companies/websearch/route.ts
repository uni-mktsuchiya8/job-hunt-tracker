import { NextResponse } from "next/server";

// Proxies Clearbit's free company-autocomplete lookup through our own
// server. Browsers commonly block direct client-side requests to
// clearbit.com via ad/privacy-blocker lists (it's on EasyPrivacy), so we
// call it from the Next.js server instead — the browser only ever talks to
// this same-origin route, which those blockers don't touch.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const res = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return NextResponse.json({ results: [] });
    const results = await res.json();
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
