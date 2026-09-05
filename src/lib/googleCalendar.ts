// Builds a Google Calendar "quick add" link — no API key, no OAuth, no
// registration. Clicking it opens Google Calendar's own "add event" screen
// with the fields pre-filled; the user still confirms and saves it
// themselves, so nothing is written to their calendar without their
// explicit action.
// https://calendar.google.com/calendar/render?action=TEMPLATE&...

function toGCalDateTime(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function buildGoogleCalendarUrl({
  title,
  startISO,
  durationMinutes = 60,
  details,
  location,
}: {
  title: string;
  startISO: string;
  durationMinutes?: number;
  details?: string | null;
  location?: string | null;
}): string {
  const start = new Date(startISO);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toGCalDateTime(start.toISOString())}/${toGCalDateTime(end.toISOString())}`,
  });
  if (details) params.set("details", details);
  if (location) params.set("location", location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
