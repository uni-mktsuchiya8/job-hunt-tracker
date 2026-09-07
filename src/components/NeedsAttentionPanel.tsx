import Link from "next/link";

export type AttentionItem = {
  companyId: string;
  companyName: string;
  reason: string;
  urgent: boolean;
};

// Dashboard callout for "which companies need something from me right
// now" — this app has no email inbox to mirror HERP Hire's 返信が必要な
// メール一覧 with, so the equivalent here is schedule-driven: an
// interview that already happened but has no result recorded yet, or one
// coming up in the next few days.
export function NeedsAttentionPanel({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-900">
        <span aria-hidden>■</span> 対応が必要な会社
      </h2>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.companyId} className="text-sm">
            <Link
              href={`/companies/${item.companyId}`}
              className="font-medium text-slate-900 hover:underline"
            >
              {item.companyName}
            </Link>
            <span
              className={`ml-2 text-xs ${item.urgent ? "text-red-600" : "text-amber-700"}`}
            >
              {item.reason}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
