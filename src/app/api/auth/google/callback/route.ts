import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/googleCalendarApi";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const settingsUrl = new URL("/settings", request.url);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  // `state` was set to the user's id when starting the flow — a lightweight
  // CSRF guard confirming this callback belongs to the session that started it.
  if (!code || state !== user.id) {
    settingsUrl.searchParams.set("google", "error");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    const tokens = await exchangeCodeForTokens(code, url.origin);
    if (!tokens.refresh_token) {
      // Google only returns a refresh_token on first consent (or when
      // prompt=consent forces re-consent, which we always request) — if
      // it's still missing, something's off; ask the user to try again.
      settingsUrl.searchParams.set("google", "error");
      return NextResponse.redirect(settingsUrl);
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error } = await supabase.from("google_calendar_connections").upsert({
      user_id: user.id,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      access_token_expires_at: expiresAt,
    });
    if (error) throw new Error(error.message);

    settingsUrl.searchParams.set("google", "connected");
    return NextResponse.redirect(settingsUrl);
  } catch {
    settingsUrl.searchParams.set("google", "error");
    return NextResponse.redirect(settingsUrl);
  }
}
