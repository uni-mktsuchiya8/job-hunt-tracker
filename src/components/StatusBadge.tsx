import type { StageResult } from "@/lib/database.types";

// Keyed loosely (not a strict enum) since 選考ステージ名 is free text with
// datalist suggestions, not a fixed set — unmapped values just fall back
// to the default gray below.
export const STATUS_STYLES: Record<string, string> = {
  検討中: "bg-zinc-100 text-zinc-700",
  カジュアル面談: "bg-zinc-100 text-zinc-700",
  書類選考: "bg-blue-100 text-blue-700",
  一次面接: "bg-indigo-100 text-indigo-700",
  二次面接: "bg-purple-100 text-purple-700",
  三次面接: "bg-violet-100 text-violet-700",
  最終面接: "bg-fuchsia-100 text-fuchsia-700",
  内定: "bg-emerald-100 text-emerald-700",
  不合格: "bg-red-100 text-red-700",
  辞退: "bg-zinc-100 text-zinc-500",
};

const RESULT_STYLES: Record<StageResult, string> = {
  未定: "bg-zinc-100 text-zinc-600",
  通過: "bg-emerald-100 text-emerald-700",
  不合格: "bg-red-100 text-red-700",
  辞退: "bg-zinc-100 text-zinc-500",
  保留: "bg-amber-100 text-amber-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-700"}`}
    >
      {status}
    </span>
  );
}

export function ResultBadge({ result }: { result: StageResult }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${RESULT_STYLES[result] ?? "bg-zinc-100 text-zinc-600"}`}
    >
      {result}
    </span>
  );
}
