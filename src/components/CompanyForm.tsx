"use client";

import {
  APPLICATION_ROUTE_SUGGESTIONS,
  APPLICATION_STATUSES,
  type Company,
} from "@/lib/database.types";

export function CompanyForm({
  company,
  action,
  submitLabel,
}: {
  company?: Company;
  action: (formData: FormData) => void;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          会社名 *
        </label>
        <input
          name="name"
          required
          defaultValue={company?.name}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          会社情報
        </label>
        <textarea
          name="info"
          rows={4}
          defaultValue={company?.info ?? ""}
          placeholder="業界、事業内容、規模、社風など"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          企業サイト URL
        </label>
        <input
          name="website"
          type="url"
          defaultValue={company?.website ?? ""}
          placeholder="https://..."
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            応募経路
          </label>
          <input
            name="application_route"
            list="application-route-suggestions"
            defaultValue={company?.application_route ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
          <datalist id="application-route-suggestions">
            {APPLICATION_ROUTE_SUGGESTIONS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            選考ステータス
          </label>
          <select
            name="status"
            defaultValue={company?.status ?? "検討中"}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
