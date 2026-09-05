"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { CalendarView, type CalendarEvent } from "@/components/CalendarView";
import { formatDateTime } from "@/lib/format";
import { computeCurrentStatus } from "@/lib/currentStatus";
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

export function DashboardView({ companies }: { companies: CompanyWithStages[] }) {
  const [view, setView] = useState<"list" | "calendar">("list");

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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
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

      {view === "calendar" ? (
        <CalendarView events={events} />
      ) : (
        <>
          {companies.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              まだ記録がありません。「+ 会社を追加」から始めましょう。
            </div>
          )}
          <ul className="space-y-3">
            {companies.map((company) => {
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
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
