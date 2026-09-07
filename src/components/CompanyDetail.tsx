"use client";

import { useState } from "react";
import { CompanyForm } from "@/components/CompanyForm";
import { StageForm } from "@/components/StageForm";
import { StageCard } from "@/components/StageCard";
import { CommuteInfo } from "@/components/CommuteInfo";
import { StatusBadge } from "@/components/StatusBadge";
import { CompanyMemoBox } from "@/components/CompanyMemoBox";
import { CompanyMemoLog } from "@/components/CompanyMemoLog";
import {
  formatRemoteDays,
  type Company,
  type CompanyMemo,
  type InterviewStage,
  type StageResult,
} from "@/lib/database.types";
import { computeCurrentStatus } from "@/lib/currentStatus";

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
  createStageAction,
  stageActions,
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
  createStageAction: (formData: FormData) => void;
  stageActions: Record<
    string,
    {
      update: (formData: FormData) => void;
      delete: () => void;
      setResult: (result: StageResult) => void;
    }
  >;
  updateMemoAction: (memo: string) => void;
  addTimelineEntryAction: (content: string) => void;
  deleteTimelineEntryAction: (memoId: string) => void;
}) {
  const [editingCompany, setEditingCompany] = useState(false);
  const [addingStage, setAddingStage] = useState(false);

  // Newest first — undated entries sort by when they were added instead,
  // so they still land in a sensible spot rather than always at one end.
  const sortedStages = [...stages].sort((a, b) => {
    const aTime = new Date(a.scheduled_at ?? a.created_at).getTime();
    const bTime = new Date(b.scheduled_at ?? b.created_at).getTime();
    return bTime - aTime;
  });

  const currentStatus = computeCurrentStatus(stages);

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
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
                    className="text-blue-600 hover:underline"
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

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500">
            選考予定(選考ステータス: <StatusBadge status={currentStatus} />)
          </h2>
          {!addingStage && (
            <button
              onClick={() => setAddingStage(true)}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
            >
              + 予定を追加
            </button>
          )}
        </div>

        {addingStage && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
            <StageForm
              submitLabel="追加"
              onCancel={() => setAddingStage(false)}
              action={(formData) => {
                createStageAction(formData);
                setAddingStage(false);
              }}
            />
          </div>
        )}

        {sortedStages.length === 0 && !addingStage && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            まだ選考予定の記録がありません。「+ 予定を追加」でカジュアル面談・書類選考・内定/不合格/辞退なども記録できます。
          </p>
        )}
        {sortedStages.length > 0 && (
          <p className="mb-2 text-xs text-slate-400">
            日程が一番新しい選考予定が「選考ステータス」として上に表示されます。
          </p>
        )}

        <ul className="space-y-3">
          {sortedStages.map((stage) => {
            const actions = stageActions[stage.id];
            return (
              <StageCard
                key={stage.id}
                stage={stage}
                companyName={company.name}
                onUpdate={actions.update}
                onResultChange={actions.setResult}
                onDelete={() => {
                  if (confirm(`「${stage.stage_name}」を削除しますか?`)) {
                    actions.delete();
                  }
                }}
              />
            );
          })}
        </ul>
      </section>

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
