"use client";

// 会社ページの「登録から」欄で、登録日をその場で直接なおせるようにする
// ための薄いラッパー。StatusSelect / ResultSelect と同じパターンで、渡さ
// れたサーバーアクションを直接呼ぶだけ。
export function RegisteredAtInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (registeredAt: string) => void;
}) {
  return (
    <input
      type="date"
      defaultValue={value}
      onChange={(e) => {
        if (e.target.value && e.target.value !== value) onChange(e.target.value);
      }}
      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-1.5 py-1 text-xs text-zinc-700 outline-none"
    />
  );
}
