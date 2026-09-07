import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompanyDetail } from "@/components/CompanyDetail";
import { StatusSelect } from "@/components/StatusSelect";
import { BackToListLink } from "@/components/BackToListLink";
import { computeCurrentStatus, sortStagesNewestFirst } from "@/lib/currentStatus";
import { elapsedDays, formatDateTime } from "@/lib/format";
import {
  addCompanyMemo,
  addCompanyTagByName,
  deleteCompany,
  deleteCompanyMemo,
  quickAddStatusStage,
  removeCompanyTag,
  updateCompany,
  updateCompanyMemo,
} from "@/app/companies/actions";
import type {
  ApplicationRoute,
  CompanyMemo,
  InterviewStage,
  Tag,
} from "@/lib/database.types";

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

  const { data: applicationRoutes } = await supabase
    .from("application_routes")
    .select("*")
    .order("name")
    .returns<ApplicationRoute[]>();

  const { data: companyTagRows } = await supabase
    .from("company_tags")
    .select("tags(*)")
    .eq("company_id", id)
    .returns<{ tags: Tag }[]>();
  const tags = (companyTagRows ?? []).map((row) => row.tags).filter(Boolean);

  const { data: allTags } = await supabase
    .from("tags")
    .select("name")
    .order("name")
    .returns<{ name: string }[]>();
  const allTagNames = (allTags ?? []).map((t) => t.name);

  const latestStage = sortStagesNewestFirst(stages ?? [])[0] ?? null;

  return (
    <div className="min-h-screen bg-green-50">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <BackToListLink />
        {/* プロフィールカード風ヘッダー: 左に色帯+丸アイコン、右にステータス
            /予定/経過日数の箱を並べる(候補者プロフィールカードのレイアウトを参考)。 */}
        <div className="mt-2 mb-6 flex overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-md">
          <div className="w-1.5 shrink-0 bg-green-600" aria-hidden />
          <div className="flex flex-1 flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-700">
                {company.name.slice(0, 1)}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-zinc-900">
                  {company.name}
                </h1>
                {company.application_route && (
                  <p className="text-xs text-zinc-500">
                    応募経路: {company.application_route}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-stretch gap-3">
              <div className="rounded-lg border border-zinc-200 bg-green-50 px-3 py-2">
                <p className="text-[11px] text-zinc-400">選考ステータス</p>
                <StatusSelect
                  value={computeCurrentStatus(stages ?? [])}
                  onChange={quickAddStatusStage.bind(null, id)}
                />
              </div>
              {/* 選考予定(選考ステップ)を選考ステータスの隣に、同じ箱型で表示 */}
              <div className="rounded-lg border border-zinc-200 bg-green-50 px-3 py-2">
                <p className="text-[11px] text-zinc-400">選考予定</p>
                <p className="text-sm text-zinc-700">
                  {latestStage
                    ? `${latestStage.stage_name} ・ ${formatDateTime(latestStage.scheduled_at)}`
                    : "選考予定なし"}
                </p>
                <Link
                  href={`/companies/${id}/schedule`}
                  className="text-xs text-green-700 hover:underline"
                >
                  すべて見る →
                </Link>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-green-50 px-3 py-2">
                <p className="text-[11px] text-zinc-400">登録から</p>
                <p className="text-sm font-semibold text-zinc-700">
                  {elapsedDays(company.registered_at)}日経過
                </p>
              </div>
            </div>
          </div>
        </div>

        <CompanyDetail
          company={company}
          memos={memos ?? []}
          homeStation={homeStation}
          applicationRoutes={applicationRoutes ?? []}
          tags={tags}
          allTagNames={allTagNames}
          updateCompanyAction={updateCompany.bind(null, id)}
          deleteCompanyAction={deleteCompany.bind(null, id)}
          updateMemoAction={updateCompanyMemo.bind(null, id)}
          addTimelineEntryAction={addCompanyMemo.bind(null, id)}
          deleteTimelineEntryAction={deleteCompanyMemo.bind(null, id)}
          addTagAction={addCompanyTagByName.bind(null, id)}
          removeTagAction={removeCompanyTag.bind(null, id)}
        />
      </main>
    </div>
  );
}
