"use client";

import { useState } from "react";
import Link from "next/link";
import { StageForm } from "@/components/StageForm";
import { StageCard } from "@/components/StageCard";
import { sortStagesNewestFirst } from "@/lib/currentStatus";
import { brandButtonStyle } from "@/lib/brandColor";
import type { InterviewStage, StageResult } from "@/lib/database.types";

// Full 選考予定 history for a company, used on the dedicated schedule
// page — the company detail page itself only shows a compact summary of
// the single latest entry (see CompanyDetail's narrow 選考予定 panel).
export function StageSection({
  companyId,
  companyName,
  stages,
  stageActions,
  createStageAction,
  initialEditStageId,
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
  // 会社ページの「選考予定」欄の編集リンクから ?edit=<stageId> で飛んできた
  // 場合、そのカードだけ最初から編集モードで開く。
  initialEditStageId?: string;
}) {
  const [addingStage, setAddingStage] = useState(false);

  const sortedStages = sortStagesNewestFirst(stages);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <Link
          href={`/companies/${companyId}`}
          className="text-xs text-zinc-500 hover:underline"
        >
          ← 会社ページに戻る
        </Link>
        {!addingStage && (
          <button
            onClick={() => setAddingStage(true)}
            style={brandButtonStyle}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-500"
          >
            + 予定を追加
          </button>
        )}
      </div>

      {addingStage && (
        <div className="mb-4 rounded-2xl border border-zinc-100 bg-white shadow-md p-4">
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
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500">
          まだ選考予定の記録がありません。「+ 予定を追加」でカジュアル面談・書類選考・内定/不合格/辞退なども記録できます。
        </p>
      )}

      <ul className="space-y-3">
        {sortedStages.map((stage) => {
          const actions = stageActions[stage.id];
          return (
            <StageCard
              key={stage.id}
              stage={stage}
              companyName={companyName}
              onUpdate={actions.update}
              onResultChange={actions.setResult}
              startEditing={stage.id === initialEditStageId}
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
