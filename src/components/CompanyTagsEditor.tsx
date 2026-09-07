"use client";

import { useState } from "react";
import type { Tag } from "@/lib/database.types";

// 応募経路とは独立した汎用タグ。入力欄はそのユーザーの既存タグ名を
// datalist で提案しつつ、無ければその場で新規作成する
// (addCompanyTagByName 側で find-or-create)。
export function CompanyTagsEditor({
  tags,
  allTagNames,
  onAdd,
  onRemove,
}: {
  tags: Tag[];
  allTagNames: string[];
  onAdd: (name: string) => void;
  onRemove: (tagId: string) => void;
}) {
  const [draft, setDraft] = useState("");

  function submit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft("");
  }

  return (
    <div>
      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => onRemove(tag.id)}
                className="text-green-400 hover:text-red-600"
                aria-label={`${tag.name}を削除`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          list="company-tag-suggestions"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="タグを追加(例: 本命、急募)"
          className="w-full max-w-xs rounded-lg border border-zinc-300 px-2 py-1 text-xs text-zinc-900 outline-none focus:border-green-500"
        />
        <datalist id="company-tag-suggestions">
          {allTagNames.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <button
          type="button"
          onClick={submit}
          className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
        >
          追加
        </button>
      </div>
    </div>
  );
}
