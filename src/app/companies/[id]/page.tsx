import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompanyDetail } from "@/components/CompanyDetail";
import { StatusSelect } from "@/components/StatusSelect";
import { ResultSelect } from "@/components/ResultSelect";
import { RegisteredAtInput } from "@/components/RegisteredAtInput";
import { BackToListLink } from "@/components/BackToListLink";
import { computeCurrentStatus, sortStagesNewestFirst } from "@/lib/currentStatus";
import { elapsedDays, elapsedDaysSince, formatDateTime } from "@/lib/format";
import {
  addCompanyMemo,
  deleteCompany,
  deleteCompanyMemo,
  quickAddStatusStage,
  updateCompany,
  updateCompanyMemo,
  updateRegisteredAt,
  updateStageResult,
} from "@/app/companies/actions";
import type {
  ApplicationRoute,
  CompanyMemo,
  InterviewStage,
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

  const latestStage = sortStagesNewestFirst(stages ?? [])[0] ?? null;
  // 「このステータスになってから何日か」= そのステータス(選考予定)を記録
  // した日から数える。選考予定がまだ無い(検討中)会社は、代わりに会社の
  // 登録日を起点にする。
  const statusElapsedDays = latestStage
    ? elapsedDaysSince(latestStage.created_at)
    : elapsedDays(company.registered_at);

  return (
    <div className="min-h-screen bg-green-50">
      <main className="mx-auto max-w-3xl px-4 py-8">
        <BackToListLink />
        {/* プロフィールカード風ヘッダー: 左に色帯、名前の下にステータス/予定/
            経過日数の箱を並べる(候補者プロフィールカードのレイアウトを参考)。
            箱は名前と横並びの右詰めではなく、名前の下にフル幅で置くことで
            余白を無駄にせず、選考予定の箱(flex-1)が一番広くなるようにして
            いる。スマホでは flex-col で縦積みに切り替わる。 */}
        <div className="mt-2 mb-6 flex overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-md">
          <div className="w-1.5 shrink-0 bg-green-600" aria-hidden />
          <div className="flex-1 p-4">
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

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <div className="rounded-lg border border-zinc-200 bg-green-50 px-3 py-2 sm:w-44 sm:shrink-0">
                <p className="text-[11px] text-zinc-400">選考ステータス</p>
                <StatusSelect
                  value={computeCurrentStatus(stages ?? [])}
                  onChange={quickAddStatusStage.bind(null, id)}
                />
                <p className="mt-1 text-[11px] text-zinc-500">
                  {statusElapsedDays}日経過
                </p>
              </div>
              {/* 選考予定(選考ステップ)。残りの横幅をすべて使う(flex-1)ので、
                  最新1件の日程・結果プルダウン・編集リンクを1行に並べても
                  窮屈にならない。 */}
              <div className="rounded-lg border border-zinc-200 bg-green-50 px-4 py-2 sm:flex-1">
                <p className="text-[11px] text-zinc-400">選考予定</p>
                {latestStage ? (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <p className="text-sm text-zinc-700">
                      {latestStage.stage_name} ・ {formatDateTime(latestStage.scheduled_at)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <ResultSelect
                        value={latestStage.result}
                        onChange={updateStageResult.bind(null, id, latestStage.id)}
                      />
                      <Link
                        href={`/companies/${id}/schedule?edit=${latestStage.id}#stage-${latestStage.id}`}
                        className="text-xs text-green-700 hover:underline"
                      >
                        編集
                      </Link>
                      <Link
                        href={`/companies/${id}/schedule`}
                        className="text-xs text-green-700 hover:underline"
                      >
                        すべて見る →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-700">選考予定なし</p>
                )}
              </div>
              {/* 登録日はここから直接なおせる(編集フォームを開かなくてよい)。
                  経過日数はこの日付から計算される。 */}
              <div className="rounded-lg border border-zinc-200 bg-green-50 px-3 py-2 sm:w-36 sm:shrink-0">
                <p className="text-[11px] text-zinc-400">登録日</p>
                <p className="text-sm font-semibold text-zinc-700">
                  {elapsedDays(company.registered_at)}日経過
                </p>
                <RegisteredAtInput
                  value={company.registered_at}
                  onChange={updateRegisteredAt.bind(null, id)}
                />
              </div>
            </div>
          </div>
        </div>

        <CompanyDetail
          company={company}
          memos={memos ?? []}
          homeStation={homeStation}
          applicationRoutes={applicationRoutes ?? []}
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
