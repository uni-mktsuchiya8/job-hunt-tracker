"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarView, type CalendarEvent } from "@/components/CalendarView";
import { CompanyMemoBox } from "@/components/CompanyMemoBox";
import { StatusSelect } from "@/components/StatusSelect";
import { NeedsAttentionPanel, type AttentionItem } from "@/components/NeedsAttentionPanel";
import { formatDateTime } from "@/lib/format";
import { computeCurrentStatus, statusRank, STATUS_PROGRESSION } from "@/lib/currentStatus";
import { brandButtonStyle } from "@/lib/brandColor";
import type { Company, CompanyMemo, InterviewStage } from "@/lib/database.types";

type CompanyWithStages = Company & {
  interview_stages: InterviewStage[];
  company_memos: CompanyMemo[];
};

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
    ...(company.company_memos ?? []).map((m) => m.content),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const ATTENTION_SOON_MS = 3 * 24 * 60 * 60 * 1000; // 3日以内

// This app has no email inbox, so there's no literal "返信が必要なメール
// 一覧" to build — the schedule-driven equivalent is: an interview that
// already happened but has no result recorded yet (needs a follow-up),
// or one coming up within the next few days (needs prep). One reminder
// per company, prioritizing the overdue case.
function computeAttentionItems(companies: CompanyWithStages[]): AttentionItem[] {
  const now = Date.now();
  const items: AttentionItem[] = [];

  for (const company of companies) {
    const stages = company.interview_stages ?? [];

    const overdue = stages
      .filter(
        (s) =>
          s.scheduled_at &&
          new Date(s.scheduled_at).getTime() < now &&
          s.result === "未定",
      )
      .sort(
        (a, b) => new Date(b.scheduled_at!).getTime() - new Date(a.scheduled_at!).getTime(),
      )[0];

    if (overdue) {
      items.push({
        companyId: company.id,
        companyName: company.name,
        reason: `${overdue.stage_name}の結果がまだ未記録です`,
        urgent: true,
      });
      continue;
    }

    const next = nextUpcomingStage(stages);
    if (next?.scheduled_at && new Date(next.scheduled_at).getTime() - now <= ATTENTION_SOON_MS) {
      items.push({
        companyId: company.id,
        companyName: company.name,
        reason: `${next.stage_name}が ${formatDateTime(next.scheduled_at)} に予定されています`,
        urgent: false,
      });
    }
  }

  return items.sort((a, b) => Number(b.urgent) - Number(a.urgent));
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" }).format(
    date,
  );
}

export function DashboardView({
  companies,
  memoActions,
  statusActions,
}: {
  companies: CompanyWithStages[];
  memoActions: Record<string, (memo: string) => void>;
  statusActions: Record<string, (status: string) => void>;
}) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [onlyNoUpcoming, setOnlyNoUpcoming] = useState(false);

  const attentionItems = useMemo(() => computeAttentionItems(companies), [companies]);

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

  // Counts per current status, for the "すべて" + per-status tab bar
  // (HERP Hire's selection-pipeline board for recruiters, mirrored here
  // for the job seeker's own list: "which companies are at 一次面接 right
  // now" etc.). Every standard status gets a tab even at 0, same as HERP
  // showing all configured steps regardless of current headcount; only
  // free-text/custom stage names are added on top of that, and only when
  // actually in use. Counts are based on the full company set, not the
  // search box, so tab counts stay stable while typing a search.
  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of companies) {
      const status = computeCurrentStatus(c.interview_stages ?? []);
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    return counts;
  }, [companies]);

  const statusTabs = useMemo(() => {
    const custom = [...statusCounts.keys()].filter(
      (s) => !STATUS_PROGRESSION.includes(s),
    );
    return [...STATUS_PROGRESSION, ...custom];
  }, [statusCounts]);

  const visibleCompanies = useMemo(() => {
    const query = search.trim().toLowerCase();
    let filtered = query
      ? companies.filter((c) => searchHaystack(c).includes(query))
      : companies;

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (c) => computeCurrentStatus(c.interview_stages ?? []) === statusFilter,
      );
    }

    if (onlyNoUpcoming) {
      filtered = filtered.filter(
        (c) => nextUpcomingStage(c.interview_stages ?? []) === null,
      );
    }

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
  }, [companies, search, sortKey, statusFilter, onlyNoUpcoming]);

  return (
    <div>
      <NeedsAttentionPanel items={attentionItems} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-medium text-zinc-500">
            {companies.length} 社を記録中
          </h2>
          <div className="flex rounded-lg border border-zinc-300 text-xs">
            <button
              onClick={() => setView("list")}
              style={view === "list" ? brandButtonStyle : undefined}
              className={`rounded-l-md px-3 py-1.5 ${
                view === "list"
                  ? "bg-green-600 text-white"
                  : "text-zinc-600 transition-colors hover:bg-zinc-100"
              }`}
            >
              リスト
            </button>
            <button
              onClick={() => setView("calendar")}
              style={view === "calendar" ? brandButtonStyle : undefined}
              className={`rounded-r-md border-l border-zinc-300 px-3 py-1.5 ${
                view === "calendar"
                  ? "bg-green-600 text-white"
                  : "text-zinc-600 transition-colors hover:bg-zinc-100"
              }`}
            >
              カレンダー
            </button>
          </div>
        </div>
        <Link
          href="/companies/new"
          style={brandButtonStyle}
          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-shadow hover:shadow-lg hover:bg-green-500"
        >
          <span className="text-base leading-none">＋</span> 会社を追加
        </Link>
      </div>

      {/* Compact pill tabs, not HERP's stacked label/count columns — with
          this many statuses, stacking made adjacent tabs run into each
          other, and the big count numbers visually duplicated what the
          選考ステータス column already shows per row. A small "(N)" here
          reads as a count, not a second status display. */}
      {view === "list" && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            style={statusFilter === "all" ? brandButtonStyle : undefined}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              statusFilter === "all"
                ? "border-green-600 bg-green-600 text-white"
                : "border-zinc-300 text-zinc-600 transition-colors hover:bg-zinc-100"
            }`}
          >
            すべて ({companies.length})
          </button>
          {statusTabs.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={statusFilter === status ? brandButtonStyle : undefined}
              className={`rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap ${
                statusFilter === status
                  ? "border-green-600 bg-green-600 text-white"
                  : "border-zinc-300 text-zinc-600 transition-colors hover:bg-zinc-100"
              }`}
            >
              {status} ({statusCounts.get(status) ?? 0})
            </button>
          ))}
        </div>
      )}

      {view === "list" && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-green-500"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="relative flex-1 min-w-[12rem]">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              width={16}
              height={16}
              className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-zinc-400"
            >
              <circle cx="8.5" cy="8.5" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="会社名・登録情報でサーチ"
              className="w-full rounded-lg border border-zinc-300 py-1.5 pr-3 pl-8 text-sm text-zinc-900 outline-none focus:border-green-500"
            />
          </div>
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-600">
            <input
              type="checkbox"
              checked={onlyNoUpcoming}
              onChange={(e) => setOnlyNoUpcoming(e.target.checked)}
              className="rounded border-zinc-300 accent-green-600"
            />
            次の選考予定がない会社のみ表示する
          </label>
        </div>
      )}

      {view === "calendar" ? (
        <CalendarView events={events} />
      ) : (
        <>
          {companies.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
              まだ記録がありません。「+ 会社を追加」から始めましょう。
            </div>
          )}
          {companies.length > 0 && visibleCompanies.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
              条件に一致する会社がありません。
            </div>
          )}
          {visibleCompanies.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-md">
              <table className="w-full min-w-[52rem] text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-left text-xs text-zinc-400">
                    <th className="px-4 py-2 font-medium">会社</th>
                    <th className="px-4 py-2 font-medium">応募経路</th>
                    <th className="px-4 py-2 font-medium">選考ステータス</th>
                    <th className="px-4 py-2 font-medium">選考予定</th>
                    <th className="px-4 py-2 font-medium">メモ</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCompanies.map((company) => {
                    const next = nextUpcomingStage(company.interview_stages ?? []);
                    const status = computeCurrentStatus(company.interview_stages ?? []);
                    return (
                      <tr
                        key={company.id}
                        className="border-b border-zinc-100 align-top transition-colors last:border-0 hover:bg-zinc-50"
                      >
                        <td className="px-4 py-3">
                          <p className="text-xs text-zinc-400">
                            {formatShortDate(company.created_at)} 登録
                          </p>
                          <div className="flex items-center gap-1.5">
                            {company.priority_rank && (
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[11px] font-semibold text-amber-700">
                                {company.priority_rank}
                              </span>
                            )}
                            <Link
                              href={`/companies/${company.id}`}
                              className="font-medium text-zinc-900 hover:underline"
                            >
                              {company.name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          {company.application_route || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusSelect
                            value={status}
                            onChange={(newStatus) =>
                              statusActions[company.id]?.(newStatus)
                            }
                          />
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {next ? (
                            <>
                              <p className="font-medium text-zinc-700">
                                {next.stage_name}
                              </p>
                              <p className="text-zinc-500">
                                {formatDateTime(next.scheduled_at)}
                              </p>
                            </>
                          ) : (
                            <span className="text-zinc-400">なし</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <CompanyMemoBox
                            memo={company.memo}
                            onSave={(memo) => memoActions[company.id]?.(memo)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
