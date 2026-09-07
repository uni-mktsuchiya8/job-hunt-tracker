import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { quickAddStatusStage, updateCompanyMemo } from "@/app/companies/actions";
import { DashboardView } from "@/components/DashboardView";
import { brandButtonStyle } from "@/lib/brandColor";
import { computeCurrentStatus } from "@/lib/currentStatus";
import { ARCHIVED_STATUSES } from "@/lib/archive";
import type { Company, CompanyMemo, InterviewStage } from "@/lib/database.types";

// company_memos (タイムライン) is fetched too even though the dashboard
// doesn't display it, so the search box can also match timeline content.
type CompanyWithStages = Company & {
  interview_stages: InterviewStage[];
  company_memos: CompanyMemo[];
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: companies, error } = await supabase
    .from("companies")
    .select("*, interview_stages(*), company_memos(*)")
    .order("updated_at", { ascending: false })
    .returns<CompanyWithStages[]>();

  // 不合格・辞退は /archive ページに移動 — 一覧には出さない。
  const activeCompanies = (companies ?? []).filter(
    (c) => !ARCHIVED_STATUSES.includes(computeCurrentStatus(c.interview_stages ?? [])),
  );
  const archivedCount = (companies?.length ?? 0) - activeCompanies.length;

  const memoActions = Object.fromEntries(
    activeCompanies.map((c) => [c.id, updateCompanyMemo.bind(null, c.id)]),
  );
  const statusActions = Object.fromEntries(
    activeCompanies.map((c) => [c.id, quickAddStatusStage.bind(null, c.id)]),
  );

  return (
    <div className="min-h-screen bg-green-50">
      <header className="border-b border-zinc-100 bg-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <span
              style={brandButtonStyle}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-sm font-bold text-white"
              aria-hidden
            >
              転
            </span>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
              転職活動トラッカー
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <span>{user?.email}</span>
            <Link
              href="/archive"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 transition-colors hover:bg-zinc-100"
            >
              終了した選考 ({archivedCount})
            </Link>
            <Link
              href="/settings"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 transition-colors hover:bg-zinc-100"
            >
              設定
            </Link>
            <form action={signOut}>
              <button className="rounded-lg border border-zinc-300 px-3 py-1.5 transition-colors hover:bg-zinc-100">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {error && (
          <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            読み込みエラー: {error.message}
          </p>
        )}
        {!error && (
          <DashboardView
            companies={activeCompanies}
            memoActions={memoActions}
            statusActions={statusActions}
          />
        )}
      </main>
    </div>
  );
}
