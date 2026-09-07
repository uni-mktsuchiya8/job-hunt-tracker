"use client";

import { useState } from "react";
import Link from "next/link";
import { StageForm } from "@/components/StageForm";
import { StageCard } from "@/components/StageCard";
import type { InterviewStage, StageResult } from "@/lib/database.types";

// Shared between the company detail page (mode="latest": just the single
// most recent 選考予定, kept compact) and the dedicated schedule/history
// page (mode="all": the full list) — same add-form and per-entry actions
// either way, just how many entries are shown.
export function StageSection({
  companyId,
  companyName,
  stages,
  stageActions,
  createStageAction,
  mode,
}: {
  companyId: string;
  companyName: string;
  stages: InterviewStage[];
  stageActions: Record<
    string,
    {
      update: (formData: FormData) => void;
      delete: () => void;
      setResult: (result: StageResult) => void;
    }
  >;
  createStageAction: (formData: FormData) => void;
  mode: "latest" | "all";
}) {
  const [addingStage, setAddingStage] = useState(false);

  // Newest first — undated entries sort by when they were added instead,
  // so they still land in a sensible spot rather than always at one end.
  const sortedStages = [...stages].sort((a, b) => {
    const aTime = new Date(a.scheduled_at ?? a.created_at).getTime();
    const bTime = new Date(b.scheduled_at ?? b.created_at).getTime();
    return bTime - aTime;
  });

  const visibleStages = mode === "latest" ? sortedStages.slice(0, 1) : sortedStages;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        {mode === "latest" ? (
          <Link
            href={`/companies/${companyId}/schedule`}
            className="text-xs text-green-700 hover:underline"
          >
            すべての選考予定を見る({stages.length}件)→
          </Link>
        ) : (
          <Link
            href={`/companies/${companyId}`}
            className="text-xs text-slate-500 hover:underline"
          >
            ← 会社ページに戻る
          </Link>
        )}
        {!addingStage && (
          <button
            onClick={() => setAddingStage(true)}
            className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600"
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

      {visibleStages.length === 0 && !addingStage && (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          まだ選考予定の記録がありません。「+ 予定を追加」でカジュアル面談・書類選考・内定/不合格/辞退なども記録できます。
        </p>
      )}

      <ul className="space-y-3">
        {visibleStages.map((stage) => {
          const actions = stageActions[stage.id];
          return (
            <StageCard
              key={stage.id}
              stage={stage}
              companyName={companyName}
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
    </div>
  );
}
