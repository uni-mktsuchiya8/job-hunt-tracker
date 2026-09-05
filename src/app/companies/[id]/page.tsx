import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompanyDetail } from "@/components/CompanyDetail";
import { StatusBadge } from "@/components/StatusBadge";
import { computeCurrentStatus } from "@/lib/currentStatus";
import {
  createStage,
  deleteCompany,
  deleteStage,
  updateCompany,
  updateStage,
} from "@/app/companies/actions";
import type { InterviewStage } from "@/lib/database.types";

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

  const stageActions = Object.fromEntries(
    (stages ?? []).map((stage) => [
      stage.id,
      {
        update: updateStage.bind(null, id, stage.id),
        delete: deleteStage.bind(null, id, stage.id),
      },
    ]),
  );

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
          <StatusBadge status={computeCurrentStatus(stages ?? [])} />
        </div>

        <CompanyDetail
          company={company}
          stages={stages ?? []}
          homeStation={homeStation}
          updateCompanyAction={updateCompany.bind(null, id)}
          deleteCompanyAction={deleteCompany.bind(null, id)}
          createStageAction={createStage.bind(null, id)}
          stageActions={stageActions}
        />
      </main>
    </div>
  );
}
