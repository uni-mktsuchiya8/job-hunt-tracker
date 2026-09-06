"use client";

import { STATUS_STYLES } from "@/components/StatusBadge";
import { NO_STAGE_STATUS, STAGE_NAME_SUGGESTIONS } from "@/lib/database.types";

// Quick pipeline update directly from the dashboard list (HERP Hire's
// inline 選考ステップ dropdown, mirrored for the job seeker's own list):
// picking a new value adds a new undated 選考ステータス entry for that
// company, the same as "+ ステータスを追加" on the detail page.
export function StatusSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (status: string) => void;
}) {
  const isCustom = value !== NO_STAGE_STATUS && !STAGE_NAME_SUGGESTIONS.includes(value);

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value !== value) onChange(e.target.value);
      }}
      className={`rounded-md border-0 px-2 py-1 text-xs font-medium outline-none ${
        STATUS_STYLES[value] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {/* 検討中(まだ選考ステータスが無い状態)とカスタム入力は選択肢に無いが、
          現在値として表示だけはできるよう先頭に足しておく。 */}
      {value === NO_STAGE_STATUS && (
        <option value={NO_STAGE_STATUS}>{NO_STAGE_STATUS}</option>
      )}
      {isCustom && <option value={value}>{value}</option>}
      {STAGE_NAME_SUGGESTIONS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
