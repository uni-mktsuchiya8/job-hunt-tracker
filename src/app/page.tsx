import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/format";
import type { Company, InterviewStage } from "@/lib/database.types";

type CompanyWithStages = Company & { interview_stages: InterviewStage[] };

function nextUpcomingStage(stages: InterviewStage[]): InterviewStage | null {
  const now = Date.now();
  const upcoming = stages
    .filter((s) => s.scheduled_at && new Date(s.scheduled_at).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime(),
    );
  return upcoming[0] ?? null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: companies, error } = await supabase
    .from("companies")
    .select("*, interview_stages(*)")
    .order("updated_at", { ascending: false })
    .returns<CompanyWithStages[]>();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900">
            転職活動トラッカー
          </h1>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>{user?.email}</span>
            <form action={signOut}>
              <button className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-500">
            {companies?.length ?? 0} 社を記録中
          </h2>
          <Link
            href="/companies/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            + 会社を追加
          </Link>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            読み込みエラー: {error.message}
          </p>
        )}

        {!error && (companies?.length ?? 0) === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            まだ記録がありません。「+ 会社を追加」から始めましょう。
          </div>
        )}

        <ul className="space-y-3">
          {companies?.map((company) => {
            const next = nextUpcomingStage(company.interview_stages ?? []);
            return (
              <li key={company.id}>
                <Link
                  href={`/companies/${company.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900">
                          {company.name}
                        </h3>
                        <StatusBadge status={company.status} />
                      </div>
                      {company.application_route && (
                        <p className="mt-1 text-xs text-slate-500">
                          応募経路: {company.application_route}
                        </p>
                      )}
                    </div>
                    {next && (
                      <div className="shrink-0 text-right text-xs">
                        <p className="text-slate-400">次の選考</p>
                        <p className="font-medium text-slate-700">
                          {next.stage_name}
                        </p>
                        <p className="text-slate-500">
                          {formatDateTime(next.scheduled_at)}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
