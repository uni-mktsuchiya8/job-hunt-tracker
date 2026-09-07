import { createClient } from "@/lib/supabase/server";
import { HomeStationForm } from "@/components/HomeStationForm";
import { disconnectGoogleCalendar } from "@/app/settings/actions";
import { brandButtonStyle } from "@/lib/brandColor";
import { BackToListLink } from "@/components/BackToListLink";

const GOOGLE_MESSAGES: Record<string, { text: string; tone: "ok" | "error" }> = {
  connected: { text: "Googleカレンダーと連携しました", tone: "ok" },
  error: { text: "連携に失敗しました。もう一度お試しください。", tone: "error" },
  not_configured: {
    text: "Googleカレンダー連携が未設定です(README参照)。",
    tone: "error",
  },
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  const { google } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const homeStation =
    typeof user?.user_metadata?.home_station === "string"
      ? user.user_metadata.home_station
      : "";

  const { data: connection } = user
    ? await supabase
        .from("google_calendar_connections")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const googleMessage = google ? GOOGLE_MESSAGES[google] : null;

  return (
    <div className="min-h-screen bg-green-50">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <BackToListLink />
        <h1 className="mt-2 mb-6 text-xl font-semibold text-zinc-900">設定</h1>

        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm p-6">
            <HomeStationForm homeStation={homeStation} />
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm p-6">
            <h2 className="text-sm font-medium text-zinc-700">
              Googleカレンダー連携
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              選考予定の日程を、自動でGoogleカレンダーに反映します。
            </p>

            {googleMessage && (
              <p
                className={`mt-3 text-sm ${googleMessage.tone === "ok" ? "text-emerald-600" : "text-red-600"}`}
              >
                {googleMessage.text}
              </p>
            )}

            <div className="mt-4">
              {connection ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-emerald-600">✓ 連携済み</span>
                  <form action={disconnectGoogleCalendar}>
                    <button className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-zinc-100">
                      連携を解除
                    </button>
                  </form>
                </div>
              ) : (
                <a
                  href="/api/auth/google/start"
                  style={brandButtonStyle}
                  className="inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500"
                >
                  Googleカレンダーと連携する
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
