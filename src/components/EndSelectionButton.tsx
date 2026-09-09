"use client";

// 「結果を問わず選考を終了する」ボタン。選考ステータスのプルダウンから
// 「終了」を探して選ぶ手間を省き、ワンクリックで済ませるための専用ボタン。
// 押すと選考予定に「終了」という undated な1件が追加され(quickAddStatus
// Stage と同じ仕組み)、選考ステータスが「終了」になって /archive に移る。
export function EndSelectionButton({ onEnd }: { onEnd: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (confirm("結果に関わらず、この選考を終了しますか?")) {
          onEnd();
        }
      }}
      className="mt-1 text-[11px] text-zinc-500 underline decoration-dotted hover:text-zinc-700"
    >
      選考を終了
    </button>
  );
}
