"use client";

import { useState } from "react";
import { CompanyAutocomplete } from "@/components/CompanyAutocomplete";
import { JobPostingExtractor } from "@/components/JobPostingExtractor";
import {
  APPLICATION_ROUTES,
  REMOTE_DAYS_OPTIONS,
  type Company,
} from "@/lib/database.types";
import type { JobFieldGuess } from "@/lib/jobFieldGuesser";

export function CompanyForm({
  company,
  action,
  submitLabel,
}: {
  company?: Company;
  action: (formData: FormData) => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(company?.name ?? "");
  const [website, setWebsite] = useState(company?.website ?? "");
  const [info, setInfo] = useState(company?.info ?? "");
  const [extracting, setExtracting] = useState(false);
  const [extractMessage, setExtractMessage] = useState<string | null>(null);

  const [salary, setSalary] = useState(company?.salary ?? "");
  const [workLocation, setWorkLocation] = useState(company?.work_location ?? "");
  const [nearestStation, setNearestStation] = useState(
    company?.nearest_station ?? "",
  );
  const [stationLoading, setStationLoading] = useState(false);
  const [stationMessage, setStationMessage] = useState<string | null>(null);
  const [remoteType, setRemoteType] = useState(company?.remote_type ?? "");
  const [jobRequirements, setJobRequirements] = useState(
    company?.job_requirements ?? "",
  );

  function handleJobExtract(guess: JobFieldGuess) {
    if (guess.companyName) setName(guess.companyName);
    if (guess.salary) setSalary(guess.salary);
    if (guess.workLocation) setWorkLocation(guess.workLocation);
    if (guess.remoteType) setRemoteType(guess.remoteType);
    if (guess.jobRequirements) setJobRequirements(guess.jobRequirements);
  }

  async function handleFindStation() {
    if (!workLocation.trim()) {
      setStationMessage("先に勤務地を入力してください");
      return;
    }
    setStationLoading(true);
    setStationMessage(null);
    try {
      const res = await fetch(
        `/api/companies/nearest-station?address=${encodeURIComponent(workLocation.trim())}`,
      );
      const data = await res.json();
      if (data.station?.name) {
        setNearestStation(data.station.name);
        setStationMessage(null);
      } else {
        setStationMessage("最寄駅を特定できませんでした。手入力してください。");
      }
    } catch {
      setStationMessage("取得に失敗しました。手入力してください。");
    } finally {
      setStationLoading(false);
    }
  }

  async function handleExtractFromUrl() {
    if (!website.trim()) {
      setExtractMessage("先にURLを入力してください");
      return;
    }
    setExtracting(true);
    setExtractMessage(null);
    try {
      const res = await fetch(
        `/api/companies/extract?url=${encodeURIComponent(website.trim())}`,
      );
      if (!res.ok) {
        setExtractMessage("取得に失敗しました。手入力してください。");
        return;
      }
      const data = await res.json();
      if (data.name) setName(data.name);
      if (data.description && !info.trim()) setInfo(data.description);
      if (!data.name) {
        setExtractMessage("会社名を特定できませんでした。手入力してください。");
      }
    } catch {
      setExtractMessage("取得に失敗しました。手入力してください。");
    } finally {
      setExtracting(false);
    }
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          会社名 *
        </label>
        <CompanyAutocomplete
          value={name}
          onValueChange={setName}
          excludeId={company?.id}
          onSelect={(s) => setWebsite(s.website)}
        />
        <p className="mt-1 text-xs text-slate-400">
          「株式会社」の前株・後株は区別せず検索します。見つからない場合はそのまま手入力できます。
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          会社情報
        </label>
        <textarea
          name="info"
          rows={4}
          value={info}
          onChange={(e) => setInfo(e.target.value)}
          placeholder="業界、事業内容、規模、社風など"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          企業サイト URL
        </label>
        <div className="mt-1 flex gap-2">
          <input
            name="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
          />
          <button
            type="button"
            onClick={handleExtractFromUrl}
            disabled={extracting}
            className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60"
          >
            {extracting ? "取得中..." : "ページから会社名を取得"}
          </button>
        </div>
        {extractMessage && (
          <p className="mt-1 text-xs text-amber-600">{extractMessage}</p>
        )}
      </div>

      <fieldset className="space-y-4 rounded-md border border-slate-200 p-3">
        <legend className="px-1 text-xs font-medium text-slate-500">
          募集条件
        </legend>

        <JobPostingExtractor onExtract={handleJobExtract} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              年収
            </label>
            <input
              name="salary"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="例: 500万〜700万円"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              勤務地
            </label>
            <div className="mt-1 flex gap-2">
              <input
                name="work_location"
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                placeholder="例: 東京都渋谷区"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
              />
              <button
                type="button"
                onClick={handleFindStation}
                disabled={stationLoading}
                className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60"
              >
                {stationLoading ? "検索中..." : "最寄駅を取得"}
              </button>
            </div>
            {stationMessage && (
              <p className="mt-1 text-xs text-amber-600">{stationMessage}</p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            最寄駅
          </label>
          <input
            name="nearest_station"
            value={nearestStation}
            onChange={(e) => setNearestStation(e.target.value)}
            placeholder="例: 渋谷"
            className="mt-1 w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            リモート可能日数(週あたり)
          </label>
          <select
            name="remote_type"
            value={remoteType}
            onChange={(e) => setRemoteType(e.target.value)}
            className="mt-1 w-full max-w-[14rem] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
          >
            <option value="">未選択</option>
            {REMOTE_DAYS_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              福利厚生
            </label>
            <input
              name="benefits"
              defaultValue={company?.benefits ?? ""}
              placeholder="例: 家賃補助、住宅手当、退職金制度"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              残業時間の目安
            </label>
            <input
              name="overtime_hours"
              defaultValue={company?.overtime_hours ?? ""}
              placeholder="例: 月20時間程度"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            求人要件(その他詳細)
          </label>
          <textarea
            name="job_requirements"
            rows={4}
            value={jobRequirements}
            onChange={(e) => setJobRequirements(e.target.value)}
            placeholder="必須スキル、募集要項の貼り付けなど"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
          />
        </div>
      </fieldset>

      <fieldset className="rounded-md border border-slate-200 p-3">
        <legend className="px-1 text-xs font-medium text-slate-500">
          志望度・検討メモ
        </legend>
        <div className="grid grid-cols-[8rem_1fr] gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              志望順位
            </label>
            <input
              name="priority_rank"
              type="number"
              min={1}
              defaultValue={company?.priority_rank ?? ""}
              placeholder="例: 1"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              志望理由
            </label>
            <textarea
              name="priority_reason"
              rows={2}
              defaultValue={company?.priority_reason ?? ""}
              placeholder="なぜこの順位なのか"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">
            決め手・懸念点
          </label>
          <textarea
            name="decision_notes"
            rows={3}
            defaultValue={company?.decision_notes ?? ""}
            placeholder="入社を判断する上で気になっている点、後で比較したいポイントなど"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
          />
        </div>
      </fieldset>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          応募経路
        </label>
        <select
          name="application_route"
          defaultValue={company?.application_route ?? ""}
          className="mt-1 w-full max-w-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
        >
          <option value="">選択してください</option>
          {APPLICATION_ROUTES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-400">
          選考の進み具合は下の「選考日程・面接記録」で管理します。
        </p>
      </div>

      <button
        type="submit"
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
