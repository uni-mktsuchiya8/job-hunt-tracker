import { buildGoogleCalendarUrl } from "@/lib/googleCalendar";

// A plain "add to calendar" link — no Google API key or OAuth needed. It
// just opens Google Calendar's own quick-add screen with the fields
// pre-filled; the user still reviews and saves it themselves.
export function AddToGoogleCalendarLink({
  title,
  startISO,
  durationMinutes,
  details,
  location,
}: {
  title: string;
  startISO: string | null;
  durationMinutes?: number;
  details?: string | null;
  location?: string | null;
}) {
  if (!startISO) return null;

  const url = buildGoogleCalendarUrl({ title, startISO, durationMinutes, details, location });

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-blue-600 hover:underline"
    >
      Googleカレンダーに追加
    </a>
  );
}
