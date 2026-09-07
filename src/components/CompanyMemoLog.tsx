"use client";

import { useState } from "react";
import { formatShortDateTime } from "@/lib/format";
import { brandButtonStyle } from "@/lib/brandColor";
import type { CompanyMemo } from "@/lib/database.types";

const COLLAPSED_COUNT = 2;

// タイムライン (company detail page only): every save adds a new dated
// entry instead of overwriting the previous one, so this renders a small
// running log (newest first) plus an add box. Separate from the
// overwrite-style CompanyMemoBox ("その場のメモ").
export function CompanyMemoLog({
  memos,
  onAdd,
  onDelete,
}: {
  memos: CompanyMemo[];
  onAdd: (content: string) => void;
  onDelete: (memoId: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(false);

  const sorted = [...memos].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const visible = expanded ? sorted : sorted.slice(0, COLLAPSED_COUNT);
  const hiddenCount = sorted.length - visible.length;

  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft("");
  };

  return (
    <div>
      <div className="flex items-start gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="メモを追加(Cmd/Ctrl+Enterでも保存)"
          className="w-full resize-y rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-700 outline-none focus:border-zinc-400 focus:bg-zinc-50"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim()}
          style={draft.trim() ? brandButtonStyle : undefined}
          className="shrink-0 rounded-md bg-teal-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          保存
        </button>
      </div>

      {sorted.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {visible.map((memo) => (
            <li
              key={memo.id}
              className="group flex items-start justify-between gap-2 rounded-md bg-zinc-50 px-2 py-1 text-xs"
            >
              <div className="min-w-0">
                <span className="mr-1.5 text-zinc-400">
                  {formatShortDateTime(memo.created_at)}
                </span>
                <span className="whitespace-pre-wrap text-zinc-700">
                  {memo.content}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onDelete(memo.id)}
                className="shrink-0 text-zinc-300 opacity-0 hover:text-red-600 group-hover:opacity-100"
                aria-label="メモを削除"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1 text-xs text-zinc-400 hover:text-zinc-600"
        >
          ▸ 過去のメモ{hiddenCount}件を表示
        </button>
      )}
      {expanded && sorted.length > COLLAPSED_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-1 text-xs text-zinc-400 hover:text-zinc-600"
        >
          ▾ 閉じる
        </button>
      )}
    </div>
  );
}
