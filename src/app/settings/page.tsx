import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HomeStationForm } from "@/components/HomeStationForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const homeStation =
    typeof user?.user_metadata?.home_station === "string"
      ? user.user_metadata.home_station
      : "";

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          ← 一覧に戻る
        </Link>
        <h1 className="mt-2 mb-6 text-xl font-semibold text-slate-900">設定</h1>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <HomeStationForm homeStation={homeStation} />
        </div>
      </main>
    </div>
  );
}
