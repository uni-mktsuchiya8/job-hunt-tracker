"use client";

import { APPLICATION_STATUSES } from "@/lib/database.types";

export function StatusHistoryForm({
  action,
  onCancel,
}: {
  action: (formData: FormData) => void;
  onCancel: () => void;
}) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const nowLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-700">
          ステータス
        </label>
        <select
          name="status"
          required
          className="mt-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-500"
        >
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700">
          実施日時
        </label>
        <input
          name="changed_at"
          type="datetime-local"
          defaultValue={nowLocal}
          className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-500"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
        >
          追加
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
