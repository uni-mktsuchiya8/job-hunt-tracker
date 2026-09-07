"use client";

import { useState } from "react";

// Shared "自分で管理できるリスト" editor — used for both 応募経路 and タグ
// master lists (add a name, delete an entry). Deleting here only removes
// the entry from the picker; it doesn't touch values already saved on
// companies (application_route is a plain string, not a foreign key).
export function ManagedListEditor({
  items,
  onAdd,
  onDelete,
  placeholder,
}: {
  items: { id: string; name: string }[];
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  placeholder: string;
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
      {items.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700"
            >
              {item.name}
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="text-zinc-400 hover:text-red-600"
                aria-label={`${item.name}を削除`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className="w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-green-500"
        />
        <button
          type="button"
          onClick={submit}
          className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
        >
          追加
        </button>
      </div>
    </div>
  );
}
