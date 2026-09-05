import type { ApplicationStatus, StageResult } from "@/lib/database.types";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  カジュアル面談: "bg-slate-100 text-slate-700",
  書類選考: "bg-blue-100 text-blue-700",
  一次面接: "bg-indigo-100 text-indigo-700",
  二次面接: "bg-purple-100 text-purple-700",
  三次面接: "bg-violet-100 text-violet-700",
  選考中: "bg-amber-100 text-amber-700",
  内定: "bg-emerald-100 text-emerald-700",
  不合格: "bg-red-100 text-red-700",
  辞退: "bg-slate-100 text-slate-500",
};

const RESULT_STYLES: Record<StageResult, string> = {
  未定: "bg-slate-100 text-slate-600",
  通過: "bg-emerald-100 text-emerald-700",
  不合格: "bg-red-100 text-red-700",
  辞退: "bg-slate-100 text-slate-500",
  保留: "bg-amber-100 text-amber-700",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {status}
    </span>
  );
}

export function ResultBadge({ result }: { result: StageResult }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${RESULT_STYLES[result] ?? "bg-slate-100 text-slate-600"}`}
    >
      {result}
    </span>
  );
}
