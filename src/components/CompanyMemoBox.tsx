"use client";

// その場のメモ: a single value that's overwritten on each save, not a log.
// Used identically on the dashboard list and the company detail page —
// unlike the full company edit form, this saves itself on blur so jotting
// a quick note doesn't require opening/submitting anything else.
export function CompanyMemoBox({
  memo,
  onSave,
  rows = 1,
}: {
  memo: string | null;
  onSave: (memo: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      key={memo ?? ""}
      defaultValue={memo ?? ""}
      onBlur={(e) => {
        if (e.target.value !== (memo ?? "")) onSave(e.target.value);
      }}
      rows={rows}
      placeholder="メモ(その場の自由記入)"
      className="w-full resize-y rounded-lg border border-transparent px-2 py-1 text-xs text-zinc-600 outline-none hover:border-zinc-200 focus:border-zinc-400 focus:bg-zinc-50"
    />
  );
}
