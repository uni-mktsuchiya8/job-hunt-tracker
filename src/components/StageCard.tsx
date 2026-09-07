"use client";

import { useState } from "react";
import { StageForm } from "@/components/StageForm";
import { AddToGoogleCalendarLink } from "@/components/AddToGoogleCalendarLink";
import { formatDateTime } from "@/lib/format";
import { brandButtonStyle } from "@/lib/brandColor";
import { STAGE_RESULTS, type InterviewStage, type StageResult } from "@/lib/database.types";

export function StageCard({
  stage,
  companyName,
  onUpdate,
  onResultChange,
  onDelete,
}: {
  stage: InterviewStage;
  companyName: string;
  onUpdate: (formData: FormData) => void;
  onResultChange: (result: StageResult) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-lg border border-zinc-200 bg-white p-4">
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
    <li className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-medium text-zinc-900">{stage.stage_name}</h4>
          <p className="mt-0.5 text-xs text-zinc-500">
            {formatDateTime(stage.scheduled_at)}
            {stage.scheduled_at && <>({stage.duration_minutes ?? 60}分)</>}
            {stage.method && <> ・ {stage.method}</>}
          </p>

          <div className="mt-2 flex flex-wrap gap-1">
            {STAGE_RESULTS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onResultChange(r)}
                style={r === stage.result ? brandButtonStyle : undefined}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  r === stage.result
                    ? "bg-teal-700 text-white"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {stage.scheduled_at && (
            <div className="mt-2">
              {stage.google_event_id ? (
                <span className="text-xs text-emerald-600">
                  ✓ Googleカレンダーに同期済み
                </span>
              ) : (
                <AddToGoogleCalendarLink
                  title={`【${stage.stage_name}】${companyName}`}
                  startISO={stage.scheduled_at}
                  durationMinutes={stage.duration_minutes ?? 60}
                  details={stage.interviewer ? `面接官: ${stage.interviewer}` : null}
                />
              )}
            </div>
          )}
          {stage.interviewer && (
            <p className="mt-2 text-sm text-zinc-700">
              <span className="text-xs text-zinc-400">面接官: </span>
              {stage.interviewer}
            </p>
          )}
          {stage.conversation_notes && (
            <div className="mt-2">
              <p className="text-xs text-zinc-400">会話内容</p>
              <p className="whitespace-pre-wrap text-sm text-zinc-700">
                {stage.conversation_notes}
              </p>
            </div>
          )}
          {stage.impression && (
            <div className="mt-2">
              <p className="text-xs text-zinc-400">印象</p>
              <p className="whitespace-pre-wrap text-sm text-zinc-700">
                {stage.impression}
              </p>
            </div>
          )}
          {stage.memo && (
            <div className="mt-2">
              <p className="text-xs text-zinc-400">メモ</p>
              <p className="whitespace-pre-wrap text-sm text-zinc-700">
                {stage.memo}
              </p>
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-2 text-xs">
          <button
            onClick={() => setEditing(true)}
            className="rounded-md border border-zinc-300 px-2 py-1 text-zinc-600 hover:bg-zinc-100"
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
