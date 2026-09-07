import Link from "next/link";

// Every page except the dashboard itself and /login should offer a
// direct way back to the company list — not just a chain of "back to
// the previous page" links, which can leave you a click or two short of
// it (e.g. the schedule history page only linking back to the company
// page, not all the way to "/").
export function BackToListLink() {
  return (
    <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
      ← 一覧に戻る
    </Link>
  );
}
