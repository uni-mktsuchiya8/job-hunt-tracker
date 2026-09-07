"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ResultBadge } from "@/components/StatusBadge";
import type { StageResult } from "@/lib/database.types";

export type CalendarEvent = {
  stageId: string;
  companyId: string;
  companyName: string;
  stageName: string;
  scheduledAt: string;
  result: StageResult;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const d = new Date(event.scheduledAt);
      const key = dateKey(d);
      const list = map.get(key) ?? [];
      list.push(event);
      list.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
      map.set(key, list);
    }
    return map;
  }, [events]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
        >
          ←
        </button>
        <h3 className="text-sm font-semibold text-slate-900">
          {year}年 {month + 1}月
        </h3>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 text-xs">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="bg-slate-50 px-2 py-1.5 text-center font-medium text-slate-500"
          >
            {w}
          </div>
        ))}
        {cells.map((date, i) => {
          const dayEvents = date ? (eventsByDay.get(dateKey(date)) ?? []) : [];
          return (
            <div
              key={i}
              className={`min-h-[6rem] bg-white p-1 align-top ${date ? "" : "bg-slate-50"}`}
            >
              {date && (
                <>
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                      isToday(date)
                        ? "bg-green-700 font-semibold text-white"
                        : "text-slate-500"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <ul className="mt-1 space-y-1">
                    {dayEvents.map((e) => (
                      <li key={e.stageId}>
                        <Link
                          href={`/companies/${e.companyId}`}
                          className="block truncate rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700 hover:bg-slate-200"
                          title={`${e.companyName} - ${e.stageName}`}
                        >
                          {e.companyName} ・ {e.stageName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <p className="mt-4 text-center text-sm text-slate-500">
          日程が登録された選考はまだありません。
        </p>
      )}

      <div className="mt-4">
        <h4 className="mb-2 text-xs font-medium text-slate-500">今月の予定一覧</h4>
        <ul className="space-y-1.5">
          {events
            .filter((e) => {
              const d = new Date(e.scheduledAt);
              return d.getFullYear() === year && d.getMonth() === month;
            })
            .map((e) => (
              <li key={e.stageId}>
                <Link
                  href={`/companies/${e.companyId}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  <span className="text-slate-700">
                    {new Date(e.scheduledAt).toLocaleString("ja-JP", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" "}
                    <span className="font-medium text-slate-900">
                      {e.companyName}
                    </span>{" "}
                    {e.stageName}
                  </span>
                  <ResultBadge result={e.result} />
                </Link>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
