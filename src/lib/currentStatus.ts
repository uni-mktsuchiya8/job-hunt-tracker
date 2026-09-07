import { NO_STAGE_STATUS, STAGE_NAME_SUGGESTIONS } from "@/lib/database.types";

// Rough selection-progress order, for the dashboard's "選考ステータス順"
// sort, and the set of tabs shown in the dashboard's status tab bar.
// 検討中(NO_STAGE_STATUS, まだ選考予定がない状態)はタブとしては出さない
// — 選考ステップの一つではなく「何もない」状態なので、あえて含めない。
// Free-text status values that aren't in this list (e.g. custom stage
// names) sort after everything else rather than erroring.
export const STATUS_PROGRESSION = [...STAGE_NAME_SUGGESTIONS];

export function statusRank(status: string): number {
  const index = STATUS_PROGRESSION.indexOf(status);
  return index === -1 ? STATUS_PROGRESSION.length : index;
}

// Shared "newest first" ordering for 選考予定 lists — undated entries sort
// by when they were added instead, so they still land in a sensible spot
// rather than always at one end. Used both for the full history list and
// for picking out just the single latest entry.
export function sortStagesNewestFirst<
  T extends { scheduled_at: string | null; created_at: string },
>(stages: T[]): T[] {
  return [...stages].sort((a, b) => {
    const aTime = new Date(a.scheduled_at ?? a.created_at).getTime();
    const bTime = new Date(b.scheduled_at ?? b.created_at).getTime();
    return bTime - aTime;
  });
}

// 選考ステータス (this company's current status) is derived from its
// 選考予定 list (interview_stages rows) rather than stored separately —
// 選考ステータス is a single dropdown-selectable value, while 選考予定 is
// the underlying list of dated/undated entries it's computed from.
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
