"use client";

import { useState } from "react";
import { CompanyForm } from "@/components/CompanyForm";
import { StageForm } from "@/components/StageForm";
import { StageCard } from "@/components/StageCard";
import { CommuteInfo } from "@/components/CommuteInfo";
import { StatusHistoryForm } from "@/components/StatusHistoryForm";
import { StatusBadge } from "@/components/StatusBadge";
import {
  formatRemoteDays,
  type Company,
  type InterviewStage,
  type StatusHistoryEntry,
} from "@/lib/database.types";
import { formatDateTime } from "@/lib/format";

export function CompanyDetail({
  company,
  stages,
  statusHistory,
  homeStation,
  updateCompanyAction,
  deleteCompanyAction,
  createStageAction,
  stageActions,
  createStatusHistoryAction,
  statusHistoryActions,
}: {
  company: Company;
  stages: InterviewStage[];
  statusHistory: StatusHistoryEntry[];
  homeStation: string | null;
  updateCompanyAction: (formData: FormData) => void;
  deleteCompanyAction: () => void;
  createStageAction: (formData: FormData) => void;
  stageActions: Record<
    string,
    { update: (formData: FormData) => void; delete: () => void }
  >;
  createStatusHistoryAction: (formData: FormData) => void;
  statusHistoryActions: Record<string, { delete: () => void }>;
}) {
  const [editingCompany, setEditingCompany] = useState(false);
  const [addingStage, setAddingStage] = useState(false);
  const [addingStatus, setAddingStatus] = useState(false);

  const sortedStages = [...stages].sort((a, b) => {
    const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity;
    const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity;
    return aTime - bTime;
  });

  const sortedStatusHistory = [...statusHistory].sort(
    (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime(),
  );

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
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-slate-400">会社情報</dt>
              <dd className="whitespace-pre-wrap text-slate-700">
                {company.info || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">企業サイト</dt>
              <dd className="text-slate-700">
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
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">応募経路</dt>
              <dd className="text-slate-700">
                {company.application_route || "-"}
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <dt className="text-xs text-slate-400">年収</dt>
                <dd className="text-slate-700">{company.salary || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">勤務地</dt>
                <dd className="text-slate-700">
                  {company.work_location || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">リモート可能日数</dt>
                <dd className="text-slate-700">
                  {formatRemoteDays(company.remote_type) || "-"}
                </dd>
              </div>
            </div>
            <div>
              <dt className="text-xs text-slate-400">最寄駅</dt>
              <dd className="text-slate-700">
                {company.nearest_station || "-"}
              </dd>
              <div className="mt-1">
                <CommuteInfo
                  homeStation={homeStation}
                  companyStation={company.nearest_station}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-slate-400">福利厚生</dt>
                <dd className="text-slate-700">{company.benefits || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">残業時間の目安</dt>
                <dd className="text-slate-700">
                  {company.overtime_hours || "-"}
                </dd>
              </div>
            </div>
            <div>
              <dt className="text-xs text-slate-400">求人要件</dt>
              <dd className="whitespace-pre-wrap text-slate-700">
                {company.job_requirements || "-"}
              </dd>
            </div>
            <div className="grid grid-cols-[6rem_1fr] gap-4">
              <div>
                <dt className="text-xs text-slate-400">志望順位</dt>
                <dd className="text-slate-700">
                  {company.priority_rank ? `第${company.priority_rank}志望` : "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">志望理由</dt>
                <dd className="whitespace-pre-wrap text-slate-700">
                  {company.priority_reason || "-"}
                </dd>
              </div>
            </div>
            <div>
              <dt className="text-xs text-slate-400">決め手・懸念点</dt>
              <dd className="whitespace-pre-wrap text-slate-700">
                {company.decision_notes || "-"}
              </dd>
            </div>
          </dl>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500">
            ステータス履歴(現在: <StatusBadge status={company.status} />)
          </h2>
          {!addingStatus && (
            <button
              onClick={() => setAddingStatus(true)}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
            >
              + ステータスを追加
            </button>
          )}
        </div>

        {addingStatus && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
            <StatusHistoryForm
              onCancel={() => setAddingStatus(false)}
              action={(formData) => {
                createStatusHistoryAction(formData);
                setAddingStatus(false);
              }}
            />
          </div>
        )}

        {sortedStatusHistory.length === 0 && !addingStatus && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            まだステータス履歴がありません。
          </p>
        )}

        <ul className="space-y-2">
          {sortedStatusHistory.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2"
            >
              <div className="flex items-center gap-3">
                <StatusBadge status={entry.status} />
                <span className="text-sm text-slate-700">
                  {formatDateTime(entry.changed_at)}
                </span>
                {entry.google_event_id && (
                  <span className="text-xs text-emerald-600">
                    ✓ Googleカレンダーに同期済み
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  if (confirm(`「${entry.status}」の履歴を削除しますか?`)) {
                    statusHistoryActions[entry.id].delete();
                  }
                }}
                className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500">
            選考日程・面接記録
          </h2>
          {!addingStage && (
            <button
              onClick={() => setAddingStage(true)}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
            >
              + 選考を追加
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
            まだ選考記録がありません。
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
    </div>
  );
}
