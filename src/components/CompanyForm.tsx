"use client";

import { useState } from "react";
import { CompanyAutocomplete } from "@/components/CompanyAutocomplete";
import { JobPostingExtractor } from "@/components/JobPostingExtractor";
import {
  REMOTE_DAYS_OPTIONS,
  STAGE_NAME_SUGGESTIONS,
  type ApplicationRoute,
  type Company,
  type JobType,
} from "@/lib/database.types";
import type { JobFieldGuess } from "@/lib/jobFieldGuesser";
import { brandButtonStyle } from "@/lib/brandColor";
import { HOURS, MINUTES } from "@/lib/timeOptions";

const NEW_LIST_VALUE = "__new__";

function todayDateString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function CompanyForm({
  company,
  applicationRoutes,
  jobTypes,
  action,
  submitLabel,
}: {
  company?: Company;
  applicationRoutes: ApplicationRoute[];
  jobTypes: JobType[];
  action: (formData: FormData) => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(company?.name ?? "");
  const [applicationRoute, setApplicationRoute] = useState(
    company?.application_route ?? "",
  );
  const [addingNewRoute, setAddingNewRoute] = useState(false);
  const [jobType, setJobType] = useState(company?.job_type ?? "");
  const [addingNewJobType, setAddingNewJobType] = useState(false);
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
        <label className="block text-sm font-medium text-zinc-700">
          会社名 *
        </label>
        <CompanyAutocomplete
          value={name}
          onValueChange={setName}
          excludeId={company?.id}
          onSelect={(s) => setWebsite(s.website)}
        />
        <p className="mt-1 text-xs text-zinc-400">
          「株式会社」の前株・後株は区別せず検索します。見つからない場合はそのまま手入力できます。
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          会社情報
        </label>
        <textarea
          name="info"
          rows={4}
          value={info}
          onChange={(e) => setInfo(e.target.value)}
          placeholder="業界、事業内容、規模、社風など"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          企業サイト URL
        </label>
        <div className="mt-1 flex gap-2">
          <input
            name="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
          />
          <button
            type="button"
            onClick={handleExtractFromUrl}
            disabled={extracting}
            className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-60"
          >
            {extracting ? "取得中..." : "ページから会社名を取得"}
          </button>
        </div>
        {extractMessage && (
          <p className="mt-1 text-xs text-amber-600">{extractMessage}</p>
        )}
      </div>

      <fieldset className="space-y-4 rounded-xl border border-zinc-100 p-3">
        <legend className="px-1 text-xs font-medium text-zinc-500">
          募集条件
        </legend>

        <JobPostingExtractor onExtract={handleJobExtract} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              年収
            </label>
            <input
              name="salary"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="例: 500万〜700万円"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              勤務地
            </label>
            <div className="mt-1 flex gap-2">
              <input
                name="work_location"
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                placeholder="例: 東京都渋谷区"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
              />
              <button
                type="button"
                onClick={handleFindStation}
                disabled={stationLoading}
                className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-60"
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
          <label className="block text-sm font-medium text-zinc-700">
            最寄駅
          </label>
          <input
            name="nearest_station"
            value={nearestStation}
            onChange={(e) => setNearestStation(e.target.value)}
            placeholder="例: 渋谷"
            className="mt-1 w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            リモート可能日数(週あたり)
          </label>
          <select
            name="remote_type"
            value={remoteType}
            onChange={(e) => setRemoteType(e.target.value)}
            className="mt-1 w-full max-w-[14rem] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
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
            <label className="block text-sm font-medium text-zinc-700">
              福利厚生
            </label>
            <input
              name="benefits"
              defaultValue={company?.benefits ?? ""}
              placeholder="例: 家賃補助、住宅手当、退職金制度"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              残業時間の目安
            </label>
            <input
              name="overtime_hours"
              defaultValue={company?.overtime_hours ?? ""}
              placeholder="例: 月20時間程度"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            求人要件(その他詳細)
          </label>
          <textarea
            name="job_requirements"
            rows={4}
            value={jobRequirements}
            onChange={(e) => setJobRequirements(e.target.value)}
            placeholder="必須スキル、募集要項の貼り付けなど"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
          />
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-zinc-100 p-3">
        <legend className="px-1 text-xs font-medium text-zinc-500">
          志望度・検討メモ
        </legend>
        <div className="grid grid-cols-[8rem_1fr] gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              志望順位
            </label>
            <input
              name="priority_rank"
              type="number"
              min={1}
              defaultValue={company?.priority_rank ?? ""}
              placeholder="例: 1"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              志望理由
            </label>
            <textarea
              name="priority_reason"
              rows={2}
              defaultValue={company?.priority_reason ?? ""}
              placeholder="なぜこの順位なのか"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-zinc-700">
            決め手・懸念点
          </label>
          <textarea
            name="decision_notes"
            rows={3}
            defaultValue={company?.decision_notes ?? ""}
            placeholder="入社を判断する上で気になっている点、後で比較したいポイントなど"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
          />
        </div>
      </fieldset>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          職種
        </label>
        {!addingNewJobType ? (
          <select
            name="job_type"
            value={jobType}
            onChange={(e) => {
              if (e.target.value === NEW_LIST_VALUE) {
                setAddingNewJobType(true);
              } else {
                setJobType(e.target.value);
              }
            }}
            className="mt-1 w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
          >
            <option value="">選択してください</option>
            {jobTypes.map((j) => (
              <option key={j.id} value={j.name}>
                {j.name}
              </option>
            ))}
            {jobType && !jobTypes.some((j) => j.name === jobType) && (
              <option value={jobType}>{jobType}</option>
            )}
            <option value={NEW_LIST_VALUE}>＋ 新しい職種を追加</option>
          </select>
        ) : (
          <div className="mt-1 flex gap-2">
            <input type="hidden" name="job_type" value={NEW_LIST_VALUE} />
            <input
              name="new_job_type"
              autoFocus
              placeholder="例: バックエンドエンジニア"
              className="w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
            />
            <button
              type="button"
              onClick={() => setAddingNewJobType(false)}
              className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
            >
              キャンセル
            </button>
          </div>
        )}
        <p className="mt-1 text-xs text-zinc-400">
          {jobTypes.length === 0 && !addingNewJobType
            ? "まだ職種がありません。「＋ 新しい職種を追加」から登録できます(設定ページでも管理できます)。"
            : "職種の追加・削除は設定ページでも管理できます。"}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          応募経路
        </label>
        {!addingNewRoute ? (
          <select
            name="application_route"
            value={applicationRoute}
            onChange={(e) => {
              if (e.target.value === NEW_LIST_VALUE) {
                setAddingNewRoute(true);
              } else {
                setApplicationRoute(e.target.value);
              }
            }}
            className="mt-1 w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
          >
            <option value="">選択してください</option>
            {applicationRoutes.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
            {applicationRoute &&
              !applicationRoutes.some((r) => r.name === applicationRoute) && (
                <option value={applicationRoute}>{applicationRoute}</option>
              )}
            <option value={NEW_LIST_VALUE}>＋ 新しい応募経路を追加</option>
          </select>
        ) : (
          <div className="mt-1 flex gap-2">
            <input type="hidden" name="application_route" value={NEW_LIST_VALUE} />
            <input
              name="new_application_route"
              autoFocus
              placeholder="例: OB訪問"
              className="w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
            />
            <button
              type="button"
              onClick={() => setAddingNewRoute(false)}
              className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
            >
              キャンセル
            </button>
          </div>
        )}
        <p className="mt-1 text-xs text-zinc-400">
          {applicationRoutes.length === 0 && !addingNewRoute
            ? "まだ応募経路がありません。「＋ 新しい応募経路を追加」から登録できます(設定ページでも管理できます)。"
            : "応募経路の追加・削除は設定ページでも管理できます。選考の進み具合は下の「選考予定」で管理します。"}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          登録日
        </label>
        <input
          name="registered_at"
          type="date"
          defaultValue={company?.registered_at ?? todayDateString()}
          className="mt-1 w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
        />
        <p className="mt-1 text-xs text-zinc-400">
          一覧・詳細ページの経過日数はこの日付から計算されます。
        </p>
      </div>

      {!company && (
        <fieldset className="space-y-3 rounded-xl border border-zinc-100 p-3">
          <legend className="px-1 text-xs font-medium text-zinc-500">
            選考ステータス・選考予定(任意)
          </legend>
          <p className="text-xs text-zinc-400">
            すでに選考が始まっている場合は、ここで最初の選考予定を一緒に登録できます。あとから追加・変更も可能です。
          </p>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              選考ステータス
            </label>
            <select
              name="initial_stage_name"
              defaultValue=""
              className="mt-1 w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
            >
              <option value="">登録しない(あとで追加)</option>
              {STAGE_NAME_SUGGESTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              選考予定日時
            </label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <input
                name="initial_scheduled_date"
                type="date"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
              />
              <select
                name="initial_scheduled_hour"
                defaultValue="10"
                className="rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {h}時
                  </option>
                ))}
              </select>
              <select
                name="initial_scheduled_minute"
                defaultValue="00"
                className="rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m}分
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">
              選考ステータスを選んだ場合のみ使われます。日程は空欄でも構いません。
            </p>
          </div>
        </fieldset>
      )}

      <button
        type="submit"
        style={brandButtonStyle}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500"
      >
        {submitLabel}
      </button>
    </form>
  );
}
