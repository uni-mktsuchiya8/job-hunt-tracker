import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompanyDetail } from "@/components/CompanyDetail";
import {
  addCompanyMemo,
  createStage,
  deleteCompany,
  deleteCompanyMemo,
  deleteStage,
  quickAddStatusStage,
  updateCompany,
  updateCompanyMemo,
  updateStage,
  updateStageResult,
} from "@/app/companies/actions";
import type { CompanyMemo, InterviewStage } from "@/lib/database.types";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const homeStation =
    typeof user?.user_metadata?.home_station === "string"
      ? user.user_metadata.home_station
      : null;

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (!company) notFound();

  const { data: stages } = await supabase
    .from("interview_stages")
    .select("*")
    .eq("company_id", id)
    .returns<InterviewStage[]>();

  const { data: memos } = await supabase
    .from("company_memos")
    .select("*")
    .eq("company_id", id)
    .returns<CompanyMemo[]>();

  const stageActions = Object.fromEntries(
    (stages ?? []).map((stage) => [
      stage.id,
      {
        update: updateStage.bind(null, id, stage.id),
        delete: deleteStage.bind(null, id, stage.id),
        setResult: updateStageResult.bind(null, id, stage.id),
      },
    ]),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          ← 一覧に戻る
        </Link>
        <div className="mt-2 mb-6">
          <h1 className="text-xl font-semibold text-slate-900">
            {company.name}
          </h1>
        </div>

        <CompanyDetail
          company={company}
          stages={stages ?? []}
          memos={memos ?? []}
          homeStation={homeStation}
          updateCompanyAction={updateCompany.bind(null, id)}
          deleteCompanyAction={deleteCompany.bind(null, id)}
          createStageAction={createStage.bind(null, id)}
          stageActions={stageActions}
          quickStatusAction={quickAddStatusStage.bind(null, id)}
          updateMemoAction={updateCompanyMemo.bind(null, id)}
          addTimelineEntryAction={addCompanyMemo.bind(null, id)}
          deleteTimelineEntryAction={deleteCompanyMemo.bind(null, id)}
        />
      </main>
    </div>
  );
}
