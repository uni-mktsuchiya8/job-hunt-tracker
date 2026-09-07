"use client";

import Link from "next/link";
import { useState } from "react";

export function CommuteInfo({
  homeStation,
  companyStation,
}: {
  homeStation: string | null;
  companyStation: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  if (!companyStation) return null;

  if (!homeStation) {
    return (
      <p className="text-xs text-zinc-400">
        <Link href="/settings" className="text-green-700 hover:underline">
          自宅最寄り駅を設定
        </Link>
        すると、ここから経路を確認できます。
      </p>
    );
  }

  async function handleCheckRoute() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/route-time?from=${encodeURIComponent(homeStation!)}&to=${encodeURIComponent(companyStation!)}`,
      );
      const data = await res.json();
      if (data.configured === false) {
        setNotConfigured(true);
        return;
      }
      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        setMessage("経路が見つかりませんでした。");
      }
    } catch {
      setMessage("経路の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  if (notConfigured) {
    return (
      <p className="text-xs text-zinc-400">
        経路検索を使うには 駅すぱあと API の登録が必要です(README参照)。
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckRoute}
        disabled={loading}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-60"
      >
        {loading
          ? "検索中..."
          : `経路を確認(${homeStation}駅 → ${companyStation}駅)`}
      </button>
      {message && <p className="mt-1 text-xs text-amber-600">{message}</p>}
    </div>
  );
}
