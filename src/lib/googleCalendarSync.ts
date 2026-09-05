import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  refreshAccessToken,
  updateCalendarEvent,
  type CalendarEventInput,
} from "@/lib/googleCalendarApi";

// Ties the Google Calendar API helpers to this user's stored connection
// (google_calendar_connections). Every function here is a no-op — never
// throws — when the user hasn't connected Google Calendar, so callers
// (server actions) can call these unconditionally without extra branching.

async function getValidAccessToken(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ accessToken: string; calendarId: string } | null> {
  const { data: connection } = await supabase
    .from("google_calendar_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!connection) return null;

  const expiresAt = connection.access_token_expires_at
    ? new Date(connection.access_token_expires_at).getTime()
    : 0;
  const stillValid = connection.access_token && expiresAt - Date.now() > 60_000;

  if (stillValid) {
    return { accessToken: connection.access_token, calendarId: connection.calendar_id };
  }

  try {
    const refreshed = await refreshAccessToken(connection.refresh_token);
    const newExpiresAt = new Date(
      Date.now() + refreshed.expires_in * 1000,
    ).toISOString();

    await supabase
      .from("google_calendar_connections")
      .update({
        access_token: refreshed.access_token,
        access_token_expires_at: newExpiresAt,
      })
      .eq("user_id", userId);

    return { accessToken: refreshed.access_token, calendarId: connection.calendar_id };
  } catch {
    // Refresh token revoked/expired — treat as disconnected rather than
    // failing the caller's save.
    return null;
  }
}

export async function syncCreateEvent(
  supabase: SupabaseClient,
  userId: string,
  input: CalendarEventInput,
): Promise<string | null> {
  const auth = await getValidAccessToken(supabase, userId);
  if (!auth) return null;
  try {
    return await createCalendarEvent(auth.accessToken, auth.calendarId, input);
  } catch {
    return null;
  }
}

export async function syncUpdateOrCreateEvent(
  supabase: SupabaseClient,
  userId: string,
  existingEventId: string | null,
  input: CalendarEventInput,
): Promise<string | null> {
  const auth = await getValidAccessToken(supabase, userId);
  if (!auth) return existingEventId;
  try {
    if (existingEventId) {
      await updateCalendarEvent(auth.accessToken, auth.calendarId, existingEventId, input);
      return existingEventId;
    }
    return await createCalendarEvent(auth.accessToken, auth.calendarId, input);
  } catch {
    return existingEventId;
  }
}

export async function syncDeleteEvent(
  supabase: SupabaseClient,
  userId: string,
  eventId: string | null,
): Promise<void> {
  if (!eventId) return;
  const auth = await getValidAccessToken(supabase, userId);
  if (!auth) return;
  try {
    await deleteCalendarEvent(auth.accessToken, auth.calendarId, eventId);
  } catch {
    // Best-effort — a dangling event on Google's side is harmless.
  }
}
