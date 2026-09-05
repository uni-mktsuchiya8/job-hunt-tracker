import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Looks up a train route between two station names via the 駅すぱあと API
// free plan (search/course/light). The free plan's response is a link to
// a "駅すぱあと for Web" results page — not structured minutes — so that's
// what we return; the UI opens it in a new tab. Requires EKISPERT_ACCESS_KEY
// (see README for the free registration steps).

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const accessKey = process.env.EKISPERT_ACCESS_KEY;
  if (!accessKey) {
    return NextResponse.json({ url: null, configured: false });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from")?.trim();
  const to = searchParams.get("to")?.trim();
  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }

  try {
    const url = new URL("https://api.ekispert.jp/v1/json/search/course/light");
    url.searchParams.set("key", accessKey);
    url.searchParams.set("from", from);
    url.searchParams.set("to", to);

    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) {
      return NextResponse.json({ url: null, configured: true });
    }
    const data = await res.json();
    const resourceUri = data?.ResultSet?.ResourceURI;
    if (typeof resourceUri !== "string" || !resourceUri) {
      return NextResponse.json({ url: null, configured: true });
    }
    return NextResponse.json({ url: resourceUri, configured: true });
  } catch {
    return NextResponse.json({ url: null, configured: true });
  }
}
