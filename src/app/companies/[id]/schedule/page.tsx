import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StageSection } from "@/components/StageSection";
import { BackToListLink } from "@/components/BackToListLink";
import {
  createStage,
  deleteStage,
  updateStage,
  updateStageResult,
} from "@/app/companies/actions";
import type { InterviewStage } from "@/lib/database.types";

// Full 選考予定 history for a company — the detail page only shows the
// single latest entry to stay compact, older ones live here.
export default async function CompanyScheduleHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit: initialEditStageId } = await searchParams;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
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
        setResult: updateStageResult.bind(null, id, stage.id),
      },
    ]),
  );

  return (
    <div className="min-h-screen bg-green-50">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <BackToListLink />
        <div className="mt-2 mb-6">
          <h1 className="text-xl font-semibold text-zinc-900">
            {company.name}
          </h1>
          <p className="text-sm text-zinc-500">すべての選考予定</p>
        </div>

        <StageSection
          companyId={company.id}
          companyName={company.name}
          stages={stages ?? []}
          stageActions={stageActions}
          createStageAction={createStage.bind(null, id)}
          initialEditStageId={initialEditStageId}
        />
      </main>
    </div>
  );
}
