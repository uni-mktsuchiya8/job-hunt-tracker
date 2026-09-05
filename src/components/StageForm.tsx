"use client";

import {
  STAGE_METHODS,
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
      <div>
        <label className="block text-xs font-medium text-slate-700">
          選考ステータス *
        </label>
        <input
          name="stage_name"
          required
          list="stage-name-suggestions"
          defaultValue={stage?.stage_name}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-500"
        />
        <datalist id="stage-name-suggestions">
          {STAGE_NAME_SUGGESTIONS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700">
            選考日程
          </label>
          <input
            name="scheduled_at"
            type="datetime-local"
            defaultValue={toDateTimeLocalValue(stage?.scheduled_at ?? null)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">
            所要時間(分)
          </label>
          <input
            name="duration_minutes"
            type="number"
            min={5}
            step={5}
            defaultValue={stage?.duration_minutes ?? 60}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">
            実施方法
          </label>
          <select
            name="method"
            defaultValue={stage?.method ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-500"
          >
            <option value="">未定</option>
            {STAGE_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          面接官名
        </label>
        <input
          name="interviewer"
          defaultValue={stage?.interviewer ?? ""}
          placeholder="例: 人事部 田中様、CTO 佐藤様"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          会話内容
        </label>
        <textarea
          name="conversation_notes"
          rows={3}
          defaultValue={stage?.conversation_notes ?? ""}
          placeholder="聞かれた質問、話した内容など"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          面接の印象
        </label>
        <textarea
          name="impression"
          rows={3}
          defaultValue={stage?.impression ?? ""}
          placeholder="雰囲気、感触、所感など"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          結果
        </label>
        <select
          name="result"
          defaultValue={stage?.result ?? "未定"}
          className="mt-1 w-full max-w-[10rem] rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-500"
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
