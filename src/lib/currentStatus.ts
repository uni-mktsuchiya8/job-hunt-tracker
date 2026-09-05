import { NO_STAGE_STATUS } from "@/lib/database.types";

// The company's "current status" is derived from its 選考ステージ list
// rather than stored separately — 選考ステージ and 選考ステータス were two
// overlapping ways to track the same thing, so this merges them into one.
// Preference: the stage with the latest scheduled_at (a dated stage tells
// you more about where things stand than an undated one); if none have a
// date, fall back to whichever stage was added most recently.
export function computeCurrentStatus(
  stages: { stage_name: string; scheduled_at: string | null; created_at: string }[],
): string {
  if (stages.length === 0) return NO_STAGE_STATUS;

  const withDate = stages.filter((s) => s.scheduled_at);
  if (withDate.length > 0) {
    return withDate.reduce((latest, s) =>
      new Date(s.scheduled_at!).getTime() > new Date(latest.scheduled_at!).getTime()
        ? s
        : latest,
    ).stage_name;
  }

  return stages.reduce((latest, s) =>
    new Date(s.created_at).getTime() > new Date(latest.created_at).getTime()
      ? s
      : latest,
  ).stage_name;
}
