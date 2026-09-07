"use client";

import { STAGE_RESULTS, type StageResult } from "@/lib/database.types";

// 会社ページの「選考予定」欄でも、/schedule ページまで移動しなくてもその場
// で結果(通過/不合格/etc.)を選べるようにするための、最新の選考予定1件専用
// のプルダウン。StatusSelect と同じパターンで、渡されたサーバーアクション
// を直接呼ぶだけの薄いラッパー。
export function ResultSelect({
  value,
  onChange,
}: {
  value: StageResult;
  onChange: (result: StageResult) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => {
        const next = e.target.value as StageResult;
        if (next !== value) onChange(next);
      }}
      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 outline-none"
    >
      {STAGE_RESULTS.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
