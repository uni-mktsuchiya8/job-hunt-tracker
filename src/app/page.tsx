import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { quickAddStatusStage, updateCompanyMemo } from "@/app/companies/actions";
import { DashboardView } from "@/components/DashboardView";
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

  const memoActions = Object.fromEntries(
    (companies ?? []).map((c) => [c.id, updateCompanyMemo.bind(null, c.id)]),
  );
  const statusActions = Object.fromEntries(
    (companies ?? []).map((c) => [c.id, quickAddStatusStage.bind(null, c.id)]),
  );

  return (
    <div className="min-h-screen bg-green-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-zinc-900">
            転職活動トラッカー
          </h1>
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <span>{user?.email}</span>
            <Link
              href="/settings"
              className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100"
            >
              設定
            </Link>
            <form action={signOut}>
              <button className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {error && (
          <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            読み込みエラー: {error.message}
          </p>
        )}
        {!error && (
          <DashboardView
            companies={companies ?? []}
            memoActions={memoActions}
            statusActions={statusActions}
          />
        )}
      </main>
    </div>
  );
}
