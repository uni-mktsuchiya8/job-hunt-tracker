import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildGoogleAuthUrl, googleCalendarConfigured } from "@/lib/googleCalendarApi";

// Kicks off the Google OAuth consent flow for connecting Calendar sync.
// GOOGLE_CLIENT_ID/SECRET must be set (see README) — this needs a Google
// Cloud Console project the user sets up themselves.

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!googleCalendarConfigured()) {
    const url = new URL("/settings", request.url);
    url.searchParams.set("google", "not_configured");
    return NextResponse.redirect(url);
  }

  const origin = new URL(request.url).origin;
  const authUrl = buildGoogleAuthUrl(origin, user.id);
  return NextResponse.redirect(authUrl);
}
