import { createClient } from "@/lib/supabase/server";
import { quickAddStatusStage, updateCompanyMemo } from "@/app/companies/actions";
import { DashboardView } from "@/components/DashboardView";
import { BackToListLink } from "@/components/BackToListLink";
import { computeCurrentStatus } from "@/lib/currentStatus";
import { ARCHIVED_STATUSES } from "@/lib/archive";
import type { Company, CompanyMemo, InterviewStage } from "@/lib/database.types";

type CompanyWithStages = Company & {
  interview_stages: InterviewStage[];
  company_memos: CompanyMemo[];
};

// 不合格・辞退になった会社はここに移動する — 一覧は現在進行中の選考だけに
// 保つため。DashboardView をそのまま再利用しているので、検索・並び替え・
// メモ編集・ステータス変更(選考を再開したい場合など)も同じように使える。
export default async function ArchivePage() {
  const supabase = await createClient();

  const { data: companies, error } = await supabase
    .from("companies")
    .select("*, interview_stages(*), company_memos(*)")
    .order("updated_at", { ascending: false })
    .returns<CompanyWithStages[]>();

  const archivedCompanies = (companies ?? []).filter((c) =>
    ARCHIVED_STATUSES.includes(computeCurrentStatus(c.interview_stages ?? [])),
  );

  const memoActions = Object.fromEntries(
    archivedCompanies.map((c) => [c.id, updateCompanyMemo.bind(null, c.id)]),
  );
  const statusActions = Object.fromEntries(
    archivedCompanies.map((c) => [c.id, quickAddStatusStage.bind(null, c.id)]),
  );

  return (
    <div className="min-h-screen bg-green-50">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <BackToListLink />
        <h1 className="mt-2 mb-6 text-xl font-semibold text-zinc-900">
          終了した選考(不合格・辞退)
        </h1>
        {error && (
          <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            読み込みエラー: {error.message}
          </p>
        )}
        {!error && (
          <DashboardView
            companies={archivedCompanies}
            memoActions={memoActions}
            statusActions={statusActions}
          />
        )}
      </main>
    </div>
  );
}
