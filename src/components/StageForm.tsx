"use client";

import {
  STAGE_NAME_SUGGESTIONS,
  STAGE_RESULTS,
  type InterviewStage,
} from "@/lib/database.types";
import { toDateTimeLocalValue } from "@/lib/format";

export function StageForm({
  stage,
  action,
  submitLabel,
  onCancel,
}: {
  stage?: InterviewStage;
  action: (formData: FormData) => void;
  submitLabel: string;
  onCancel?: () => void;
}) {
  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700">
            選考ステージ *
          </label>
          <input
            name="stage_name"
            required
            list="stage-name-suggestions"
            defaultValue={stage?.stage_name}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
          />
          <datalist id="stage-name-suggestions">
            {STAGE_NAME_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">
            選考日程
          </label>
          <input
            name="scheduled_at"
            type="datetime-local"
            defaultValue={toDateTimeLocalValue(stage?.scheduled_at ?? null)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          面接の印象
        </label>
        <textarea
          name="impression"
          rows={3}
          defaultValue={stage?.impression ?? ""}
          placeholder="面接官の雰囲気、質問内容、感触など"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          結果
        </label>
        <select
          name="result"
          defaultValue={stage?.result ?? "未定"}
          className="mt-1 w-full max-w-[10rem] rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-slate-500"
        >
          {STAGE_RESULTS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}
