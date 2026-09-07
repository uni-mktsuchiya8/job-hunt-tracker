"use client";

import {
  STAGE_METHODS,
  STAGE_NAME_SUGGESTIONS,
  STAGE_RESULTS,
  type InterviewStage,
} from "@/lib/database.types";
import { toDateTimeLocalValue } from "@/lib/format";
import { brandGreenStyle } from "@/lib/brandColor";

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

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
  // Split the stored datetime into separate date/hour/minute parts so the
  // form can offer plain <select>s instead of a native datetime-local
  // widget (whose time-of-day picker is fiddly to use with a mouse).
  const [defaultDate, defaultTime] = toDateTimeLocalValue(
    stage?.scheduled_at ?? null,
  ).split("T");
  const [defaultHour = "10", defaultMinuteRaw] = (defaultTime ?? "").split(":");
  const defaultMinute = defaultMinuteRaw
    ? MINUTES.reduce((closest, m) =>
        Math.abs(Number(m) - Number(defaultMinuteRaw)) <
        Math.abs(Number(closest) - Number(defaultMinuteRaw))
          ? m
          : closest,
      )
    : "00";

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-700">
          予定名 *
        </label>
        <input
          name="stage_name"
          required
          list="stage-name-suggestions"
          defaultValue={stage?.stage_name}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-emerald-600"
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
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <input
            name="scheduled_date"
            type="date"
            defaultValue={defaultDate}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-emerald-600"
          />
          <select
            name="scheduled_hour"
            defaultValue={defaultHour}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-emerald-600"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h}時
              </option>
            ))}
          </select>
          <select
            name="scheduled_minute"
            defaultValue={defaultMinute}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-emerald-600"
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                {m}分
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          日付を入れないと未定として扱われます。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700">
            所要時間(分)
          </label>
          <input
            name="duration_minutes"
            type="number"
            min={0}
            step={5}
            defaultValue={stage?.duration_minutes ?? 60}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-emerald-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">
            実施方法
          </label>
          <select
            name="method"
            defaultValue={stage?.method ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-emerald-600"
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
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-emerald-600"
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
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-emerald-600"
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
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-emerald-600"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          メモ
        </label>
        <textarea
          name="memo"
          rows={2}
          defaultValue={stage?.memo ?? ""}
          placeholder="自由記入(その他気になったこと、次回までにやることなど)"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-emerald-600"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          結果
        </label>
        <select
          name="result"
          defaultValue={stage?.result ?? "未定"}
          className="mt-1 w-full max-w-[10rem] rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-emerald-600"
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
          style={brandGreenStyle}
          className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
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
