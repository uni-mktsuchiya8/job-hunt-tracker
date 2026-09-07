"use client";

import { useState } from "react";
import Link from "next/link";
import { CompanyForm } from "@/components/CompanyForm";
import { CommuteInfo } from "@/components/CommuteInfo";
import { CompanyMemoBox } from "@/components/CompanyMemoBox";
import { CompanyMemoLog } from "@/components/CompanyMemoLog";
import { formatDateTime } from "@/lib/format";
import {
  formatRemoteDays,
  type Company,
  type CompanyMemo,
  type InterviewStage,
} from "@/lib/database.types";
import { sortStagesNewestFirst } from "@/lib/currentStatus";

// One-line "ラベル: 値" row for short fields — most of these are empty on
// a freshly-added company, and a 2-line label-above-value block per field
// (the original layout) made the page mostly whitespace. A single line
// keeps every field visible without the scroll.
function InfoLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="truncate">
      <span className="text-slate-400">{label}: </span>
      <span className="text-slate-700">{children}</span>
    </p>
  );
}

// For the longer free-text fields (会社情報, 求人要件, 志望理由, 決め手・
// 懸念点): collapse to the same compact one-liner when empty, but expand
// to a label-above-paragraph block once there's actual multi-line content
// to show.
function InfoBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return <InfoLine label={label}>-</InfoLine>;
  }
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-slate-700">{value}</p>
    </div>
  );
}

export function CompanyDetail({
  company,
  stages,
  memos,
  homeStation,
  updateCompanyAction,
  deleteCompanyAction,
  updateMemoAction,
  addTimelineEntryAction,
  deleteTimelineEntryAction,
}: {
  company: Company;
  stages: InterviewStage[];
  memos: CompanyMemo[];
  homeStation: string | null;
  updateCompanyAction: (formData: FormData) => void;
  deleteCompanyAction: () => void;
  updateMemoAction: (memo: string) => void;
  addTimelineEntryAction: (content: string) => void;
  deleteTimelineEntryAction: (memoId: string) => void;
}) {
  const [editingCompany, setEditingCompany] = useState(false);

  const latestStage = sortStagesNewestFirst(stages)[0] ?? null;

  return (
    <div className="space-y-8">
      {/* 会社情報が主、選考予定は最新1件だけを1/6幅の細い列で添える。
          選考ステータス(プルダウン)は社名の隣(ページヘッダー側)に表示。
          古い選考予定は /schedule ページ側に移した。 */}
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 sm:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-500">会社情報</h2>
            <div className="flex gap-2">
              {!editingCompany && (
                <button
                  onClick={() => setEditingCompany(true)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
                >
                  編集
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm(`「${company.name}」を削除しますか?`)) {
                    deleteCompanyAction();
                  }
                }}
                className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                会社を削除
              </button>
            </div>
          </div>

          {editingCompany ? (
            <CompanyForm
              company={company}
              submitLabel="保存"
              action={(formData) => {
                updateCompanyAction(formData);
                setEditingCompany(false);
              }}
            />
          ) : (
            <div className="space-y-3 text-sm">
              <InfoBlock label="会社情報" value={company.info} />

              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
                <InfoLine label="企業サイト">
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-700 hover:underline"
                    >
                      {company.website}
                    </a>
                  ) : (
                    "-"
                  )}
                </InfoLine>
                <InfoLine label="応募経路">{company.application_route || "-"}</InfoLine>
                <InfoLine label="年収">{company.salary || "-"}</InfoLine>
                <InfoLine label="勤務地">{company.work_location || "-"}</InfoLine>
                <InfoLine label="リモート可能日数">
                  {formatRemoteDays(company.remote_type) || "-"}
                </InfoLine>
                <InfoLine label="福利厚生">{company.benefits || "-"}</InfoLine>
                <InfoLine label="残業時間の目安">
                  {company.overtime_hours || "-"}
                </InfoLine>
                <InfoLine label="志望順位">
                  {company.priority_rank ? `第${company.priority_rank}志望` : "-"}
                </InfoLine>
              </div>

              <div>
                <InfoLine label="最寄駅">{company.nearest_station || "-"}</InfoLine>
                <div className="mt-1">
                  <CommuteInfo
                    homeStation={homeStation}
                    companyStation={company.nearest_station}
                  />
                </div>
              </div>

              <InfoBlock label="求人要件" value={company.job_requirements} />
              <InfoBlock label="志望理由" value={company.priority_reason} />
              <InfoBlock label="決め手・懸念点" value={company.decision_notes} />
            </div>
          )}

          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="mb-1 text-xs text-slate-400">
              メモ(その場の自由記入。一覧画面にも表示されます)
            </p>
            <CompanyMemoBox memo={company.memo} onSave={updateMemoAction} rows={2} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-3 sm:col-span-1">
          <h2 className="mb-2 text-xs font-semibold text-slate-500">選考予定</h2>
          {latestStage ? (
            <div className="text-xs">
              <p className="font-medium text-slate-700">{latestStage.stage_name}</p>
              <p className="text-slate-500">{formatDateTime(latestStage.scheduled_at)}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">記録なし</p>
          )}
          <Link
            href={`/companies/${company.id}/schedule`}
            className="mt-2 block text-xs text-green-700 hover:underline"
          >
            すべて見る →
          </Link>
        </section>
      </div>

      <section>
        <h2 className="mb-1 text-sm font-semibold text-slate-500">
          タイムライン
        </h2>
        <p className="mb-4 text-xs text-slate-400">
          保存するたびに1件ずつ蓄積される経過記録です(上のメモとは別に残ります)。
        </p>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <CompanyMemoLog
            memos={memos}
            onAdd={addTimelineEntryAction}
            onDelete={deleteTimelineEntryAction}
          />
        </div>
      </section>
    </div>
  );
}
