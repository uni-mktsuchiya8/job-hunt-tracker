"use client";

import { useState } from "react";
import type { JobFieldGuess } from "@/lib/jobFieldGuesser";

async function fetchFromUrl(url: string): Promise<JobFieldGuess> {
  const res = await fetch(`/api/companies/extract-job?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error("failed");
  return res.json();
}

async function fetchFromText(text: string): Promise<JobFieldGuess> {
  const res = await fetch("/api/companies/extract-job-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("failed");
  return res.json();
}

function summarize(guess: JobFieldGuess): string {
  const filled = [
    guess.companyName && "会社名",
    guess.salary && "年収",
    guess.workLocation && "勤務地",
    guess.remoteType && "リモート可否",
    guess.jobRequirements && "求人要件",
  ].filter(Boolean);
  if (filled.length === 0) {
    return "情報を見つけられませんでした。手入力してください。";
  }
  return `${filled.join("・")} を自動入力しました(キーワード抽出のため、必ず内容をご確認ください)`;
}

export function JobPostingExtractor({
  onExtract,
}: {
  onExtract: (guess: JobFieldGuess) => void;
}) {
  const [url, setUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  async function handleUrlExtract() {
    if (!url.trim()) {
      setMessage("求人票のURLを入力してください");
      return;
    }
    setUrlLoading(true);
    setMessage(null);
    try {
      const guess = await fetchFromUrl(url.trim());
      onExtract(guess);
      setMessage(summarize(guess));
    } catch {
      setMessage("取得に失敗しました。手入力してください。");
    } finally {
      setUrlLoading(false);
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setOcrLoading(true);
    setOcrProgress(0);
    setMessage(null);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("jpn+eng", undefined, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.round((m.progress ?? 0) * 100));
          }
        },
      });
      try {
        const {
          data: { text },
        } = await worker.recognize(file);
        if (!text.trim()) {
          setMessage("画像から文字を読み取れませんでした。");
          return;
        }
        const guess = await fetchFromText(text);
        onExtract(guess);
        setMessage(summarize(guess));
      } finally {
        await worker.terminate();
      }
    } catch {
      setMessage("画像の読み取りに失敗しました。手入力してください。");
    } finally {
      setOcrLoading(false);
      setOcrProgress(0);
    }
  }

  const busy = urlLoading || ocrLoading;

  return (
    <div className="rounded-md border border-dashed border-slate-300 p-3">
      <p className="text-xs font-medium text-slate-500">
        求人票から自動入力(キーワード抽出・要確認)
      </p>

      <div className="mt-2 flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="求人票のURL"
          className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-emerald-600"
        />
        <button
          type="button"
          onClick={handleUrlExtract}
          disabled={busy}
          className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60"
        >
          {urlLoading ? "取得中..." : "URLから取得"}
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <label className="shrink-0 cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
          {ocrLoading ? `読み取り中... ${ocrProgress}%` : "求人票のキャプチャ画像を選択"}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            disabled={busy}
            className="hidden"
          />
        </label>
        <span className="text-xs text-slate-400">
          画像はブラウザ内で読み取るだけで保存・送信はされません
        </span>
      </div>

      {message && <p className="mt-2 text-xs text-amber-600">{message}</p>}
    </div>
  );
}
