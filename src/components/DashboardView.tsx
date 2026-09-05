"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { CalendarView, type CalendarEvent } from "@/components/CalendarView";
import { formatDateTime } from "@/lib/format";
import { computeCurrentStatus, statusRank } from "@/lib/currentStatus";
import type { Company, InterviewStage } from "@/lib/database.types";

type CompanyWithStages = Company & { interview_stages: InterviewStage[] };

type SortKey = "updated" | "status" | "date";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "updated", label: "更新順" },
  { value: "status", label: "選考ステータス順" },
  { value: "date", label: "選考日程順" },
];

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

// Sort key for "選考日程順", agenda-style: companies with an upcoming
// stage come first (soonest first), then companies whose stages are all
// in the past (most recent first), then companies with no dated stage at
// all.
function dateSortValue(stages: InterviewStage[]): { bucket: number; time: number } {
  const next = nextUpcomingStage(stages);
  if (next?.scheduled_at) return { bucket: 0, time: new Date(next.scheduled_at).getTime() };
  const dated = stages.filter((s) => s.scheduled_at);
  if (dated.length > 0) {
    const latest = Math.max(...dated.map((s) => new Date(s.scheduled_at!).getTime()));
    return { bucket: 1, time: -latest };
  }
  return { bucket: 2, time: 0 };
}

// Fields searched by the "登録情報サーチ" box — anything a user might
// type to recall which company they registered.
function searchHaystack(company: CompanyWithStages): string {
  return [
    company.name,
    company.info,
    company.job_requirements,
    company.salary,
    company.work_location,
    company.nearest_station,
    company.application_route,
    company.decision_notes,
    company.priority_reason,
    company.memo,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function DashboardView({
  companies,
  memoActions,
}: {
  companies: CompanyWithStages[];
  memoActions: Record<string, (memo: string) => void>;
}) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updated");

  const events: CalendarEvent[] = companies.flatMap((company) =>
    (company.interview_stages ?? [])
      .filter((s) => s.scheduled_at)
      .map((s) => ({
        stageId: s.id,
        companyId: company.id,
        companyName: company.name,
        stageName: s.stage_name,
        scheduledAt: s.scheduled_at!,
        result: s.result,
      })),
  );

  const visibleCompanies = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? companies.filter((c) => searchHaystack(c).includes(query))
      : companies;

    if (sortKey === "updated") return filtered;

    const sorted = [...filtered];
    if (sortKey === "status") {
      sorted.sort(
        (a, b) =>
          statusRank(computeCurrentStatus(a.interview_stages ?? [])) -
          statusRank(computeCurrentStatus(b.interview_stages ?? [])),
      );
    } else if (sortKey === "date") {
      sorted.sort((a, b) => {
        const aVal = dateSortValue(a.interview_stages ?? []);
        const bVal = dateSortValue(b.interview_stages ?? []);
        return aVal.bucket !== bVal.bucket
          ? aVal.bucket - bVal.bucket
          : aVal.time - bVal.time;
      });
    }
    return sorted;
  }, [companies, search, sortKey]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-medium text-slate-500">
            {companies.length} 社を記録中
          </h2>
          <div className="flex rounded-md border border-slate-300 text-xs">
            <button
              onClick={() => setView("list")}
              className={`rounded-l-md px-3 py-1.5 ${
                view === "list"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              リスト
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`rounded-r-md border-l border-slate-300 px-3 py-1.5 ${
                view === "calendar"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              カレンダー
            </button>
          </div>
        </div>
        <Link
          href="/companies/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + 会社を追加
        </Link>
      </div>

      {view === "list" && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="会社名・登録情報でサーチ"
            className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-500"
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-500"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {view === "calendar" ? (
        <CalendarView events={events} />
      ) : (
        <>
          {companies.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              まだ記録がありません。「+ 会社を追加」から始めましょう。
            </div>
          )}
          {companies.length > 0 && visibleCompanies.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              条件に一致する会社がありません。
            </div>
          )}
          <ul className="space-y-3">
            {visibleCompanies.map((company) => {
              const next = nextUpcomingStage(company.interview_stages ?? []);
              return (
                <li
                  key={company.id}
                  className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                >
                  <Link href={`/companies/${company.id}`} className="block">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          {company.priority_rank && (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[11px] font-semibold text-amber-700">
                              {company.priority_rank}
                            </span>
                          )}
                          <h3 className="font-medium text-slate-900">
                            {company.name}
                          </h3>
                          <StatusBadge
                            status={computeCurrentStatus(company.interview_stages ?? [])}
                          />
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

                  <div className="mt-3 border-t border-slate-100 pt-2">
                    <textarea
                      key={`${company.id}:${company.memo ?? ""}`}
                      defaultValue={company.memo ?? ""}
                      onBlur={(e) => {
                        if (e.target.value !== (company.memo ?? "")) {
                          memoActions[company.id]?.(e.target.value);
                        }
                      }}
                      rows={1}
                      placeholder="メモ(自由記入)"
                      className="w-full resize-y rounded-md border border-transparent px-2 py-1 text-xs text-slate-600 outline-none hover:border-slate-200 focus:border-slate-400 focus:bg-slate-50"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
