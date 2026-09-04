"use client";

import { useState } from "react";
import { StageForm } from "@/components/StageForm";
import { ResultBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/format";
import type { InterviewStage } from "@/lib/database.types";

export function StageCard({
  stage,
  onUpdate,
  onDelete,
}: {
  stage: InterviewStage;
  onUpdate: (formData: FormData) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-lg border border-slate-200 bg-white p-4">
        <StageForm
          stage={stage}
          submitLabel="保存"
          onCancel={() => setEditing(false)}
          action={(formData) => {
            onUpdate(formData);
            setEditing(false);
          }}
        />
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-slate-900">{stage.stage_name}</h4>
            <ResultBadge result={stage.result} />
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {formatDateTime(stage.scheduled_at)}
          </p>
          {stage.impression && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {stage.impression}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2 text-xs">
          <button
            onClick={() => setEditing(true)}
            className="rounded-md border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-100"
          >
            編集
          </button>
          <button
            onClick={onDelete}
            className="rounded-md border border-red-200 px-2 py-1 text-red-600 hover:bg-red-50"
          >
            削除
          </button>
        </div>
      </div>
    </li>
  );
}
