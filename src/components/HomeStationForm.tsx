"use client";

import { useActionState } from "react";
import { updateHomeStation, type SettingsState } from "@/app/settings/actions";
import { brandGreenStyle } from "@/lib/brandColor";

const initialState: SettingsState = { message: null, error: null };

export function HomeStationForm({ homeStation }: { homeStation: string }) {
  const [state, formAction, pending] = useActionState(
    updateHomeStation,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          自宅最寄り駅
        </label>
        <input
          name="home_station"
          defaultValue={homeStation}
          placeholder="例: 新宿"
          className="mt-1 w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600"
        />
        <p className="mt-1 text-xs text-slate-400">
          各社の詳細ページで、ここから会社の最寄り駅までの経路を確認できるようになります。
        </p>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.message && (
        <p className="text-sm text-emerald-600">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        style={brandGreenStyle}
        className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
      >
        {pending ? "保存中..." : "保存"}
      </button>
    </form>
  );
}
