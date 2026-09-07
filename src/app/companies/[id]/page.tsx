import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompanyDetail } from "@/components/CompanyDetail";
import { StatusSelect } from "@/components/StatusSelect";
import { computeCurrentStatus } from "@/lib/currentStatus";
import {
  addCompanyMemo,
  deleteCompany,
  deleteCompanyMemo,
  quickAddStatusStage,
  updateCompany,
  updateCompanyMemo,
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

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          ← 一覧に戻る
        </Link>
        <div className="mt-2 mb-6 flex items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900">
            {company.name}
          </h1>
          <StatusSelect
            value={computeCurrentStatus(stages ?? [])}
            onChange={quickAddStatusStage.bind(null, id)}
          />
        </div>

        <CompanyDetail
          company={company}
          stages={stages ?? []}
          memos={memos ?? []}
          homeStation={homeStation}
          updateCompanyAction={updateCompany.bind(null, id)}
          deleteCompanyAction={deleteCompany.bind(null, id)}
          updateMemoAction={updateCompanyMemo.bind(null, id)}
          addTimelineEntryAction={addCompanyMemo.bind(null, id)}
          deleteTimelineEntryAction={deleteCompanyMemo.bind(null, id)}
        />
      </main>
    </div>
  );
}
