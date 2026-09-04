import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { guessJobFieldsFromText } from "@/lib/jobFieldGuesser";

// Same keyword guesser as /api/companies/extract-job, but takes raw text
// directly instead of fetching a URL — used for text OCR'd client-side
// from a screenshot (see JobPostingExtractor.tsx). No fetch happens here,
// so no SSRF surface; just requires login to avoid being an open text
// sink on a public deployment.

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const text = (body as { text?: unknown })?.text;
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const guess = guessJobFieldsFromText(text.slice(0, 30_000));
  return NextResponse.json(guess);
}
