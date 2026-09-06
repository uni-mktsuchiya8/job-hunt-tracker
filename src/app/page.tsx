import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { addCompanyMemo, deleteCompanyMemo } from "@/app/companies/actions";
import { DashboardView } from "@/components/DashboardView";
import type { Company, CompanyMemo, InterviewStage } from "@/lib/database.types";

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

  const addMemoActions = Object.fromEntries(
    (companies ?? []).map((c) => [c.id, addCompanyMemo.bind(null, c.id)]),
  );
  const deleteMemoActions = Object.fromEntries(
    (companies ?? []).map((c) => [c.id, deleteCompanyMemo.bind(null, c.id)]),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900">
            転職活動トラッカー
          </h1>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>{user?.email}</span>
            <Link
              href="/settings"
              className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
            >
              設定
            </Link>
            <form action={signOut}>
              <button className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {error && (
          <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            読み込みエラー: {error.message}
          </p>
        )}
        {!error && (
          <DashboardView
            companies={companies ?? []}
            addMemoActions={addMemoActions}
            deleteMemoActions={deleteMemoActions}
          />
        )}
      </main>
    </div>
  );
}
