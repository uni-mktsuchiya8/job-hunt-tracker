"use client";

import { useEffect, useRef, useState } from "react";
import { normalizeCompanyName } from "@/lib/companyName";

type OwnCompany = { id: string; name: string; website: string | null };
type WebSuggestion = { name: string; domain: string; logo: string | null };
type NtaSuggestion = {
  corporateNumber: string;
  name: string;
  prefecture: string;
  city: string;
  streetNumber: string;
};

/**
 * Best-effort web lookup (Clearbit Autocomplete), called through our own
 * `/api/companies/websearch` route rather than clearbit.com directly —
 * that domain is on common ad/privacy-blocker lists (uBlock Origin, Brave,
 * Safari ITP, etc.) and gets silently blocked client-side, but a
 * server-to-server call from our own route isn't affected. This is the
 * only source that can supply a website URL guess.
 */
async function fetchWebSuggestions(query: string): Promise<WebSuggestion[]> {
  const res = await fetch(
    `/api/companies/websearch?q=${encodeURIComponent(query)}`,
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

/**
 * Official Japanese corporate registry lookup (National Tax Agency 法人番号
 * Web-API), via `/api/companies/nta-search`. Far more complete for Japanese
 * companies than Clearbit, and matches regardless of 前株/後株 (uses the
 * registry's normalized search field), but has no website URL — it's a
 * company registry, not a marketing directory. Returns configured:false
 * until NTA_APPLICATION_ID is set up (see README).
 */
async function fetchNtaSuggestions(
  query: string,
): Promise<{ results: NtaSuggestion[]; configured: boolean }> {
  const res = await fetch(
    `/api/companies/nta-search?q=${encodeURIComponent(query)}`,
  );
  if (!res.ok) return { results: [], configured: true };
  return res.json();
}

export function CompanyAutocomplete({
  value,
  onValueChange,
  excludeId,
  onSelect,
}: {
  value: string;
  onValueChange: (value: string) => void;
  excludeId?: string;
  onSelect: (suggestion: { name: string; website: string }) => void;
}) {
  const query = value;
  const setQuery = onValueChange;
  const [open, setOpen] = useState(false);
  const [ownCompanies, setOwnCompanies] = useState<OwnCompany[]>([]);
  const [webSuggestions, setWebSuggestions] = useState<WebSuggestion[]>([]);
  const [webLoading, setWebLoading] = useState(false);
  const [ntaSuggestions, setNtaSuggestions] = useState<NtaSuggestion[]>([]);
  const [ntaLoading, setNtaLoading] = useState(false);
  const [ntaConfigured, setNtaConfigured] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load the user's own saved companies once — same-origin, so it isn't
  // affected by third-party trackers/ad-blocker rules.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/companies")
      .then((res) => (res.ok ? res.json() : { companies: [] }))
      .then((data) => {
        if (!cancelled) setOwnCompanies(data.companies ?? []);
      })
      .catch(() => {
        if (!cancelled) setOwnCompanies([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setWebLoading(true);
      setNtaLoading(true);
      try {
        const results = await fetchWebSuggestions(query);
        if (!cancelled) setWebSuggestions(results.slice(0, 5));
      } catch {
        if (!cancelled) setWebSuggestions([]);
      } finally {
        if (!cancelled) setWebLoading(false);
      }
      try {
        const { results, configured } = await fetchNtaSuggestions(query);
        if (!cancelled) {
          setNtaSuggestions(results);
          setNtaConfigured(configured);
        }
      } catch {
        if (!cancelled) setNtaSuggestions([]);
      } finally {
        if (!cancelled) setNtaLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedQuery = normalizeCompanyName(query);
  const ownMatches =
    normalizedQuery.length < 1
      ? []
      : ownCompanies
          .filter((c) => c.id !== excludeId)
          .filter((c) =>
            normalizeCompanyName(c.name).includes(normalizedQuery),
          )
          .slice(0, 5);

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative">
      <input
        name="name"
        required
        value={query}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-green-500"
      />

      {showDropdown && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-zinc-200 bg-white shadow-lg">
          {ownMatches.length > 0 && (
            <div>
              <p className="px-3 pt-2 text-[11px] font-medium text-zinc-400">
                登録済みの会社
              </p>
              <ul>
                {ownMatches.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(c.name);
                        setOpen(false);
                        onSelect({ name: c.name, website: c.website ?? "" });
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-zinc-50"
                    >
                      <span className="text-zinc-900">{c.name}</span>
                      {c.website && (
                        <span className="truncate text-xs text-zinc-400">
                          {c.website}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ntaConfigured && (
            <div>
              <p className="px-3 pt-2 text-[11px] font-medium text-zinc-400">
                国税庁 法人番号(公式・前株/後株を区別せず検索・URLなし)
              </p>
              {ntaLoading && (
                <p className="px-3 py-2 text-xs text-zinc-400">検索中...</p>
              )}
              {!ntaLoading && ntaSuggestions.length === 0 && (
                <p className="px-3 py-2 text-xs text-zinc-400">
                  候補が見つかりません。
                </p>
              )}
              <ul>
                {ntaSuggestions.map((c) => (
                  <li key={c.corporateNumber}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(c.name);
                        setOpen(false);
                        onSelect({ name: c.name, website: "" });
                      }}
                      className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-zinc-50"
                    >
                      <span className="text-zinc-900">{c.name}</span>
                      <span className="truncate text-xs text-zinc-400">
                        {c.prefecture}
                        {c.city}
                        {c.streetNumber}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="px-3 pt-2 text-[11px] font-medium text-zinc-400">
              Web検索候補(参考・URL自動入力用)
            </p>
            {webLoading && (
              <p className="px-3 py-2 text-xs text-zinc-400">検索中...</p>
            )}
            {!webLoading && webSuggestions.length === 0 && (
              <p className="px-3 py-2 text-xs text-zinc-400">
                候補が見つかりません。そのまま手入力できます。
              </p>
            )}
            <ul>
              {webSuggestions.map((s) => (
                <li key={s.domain}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(s.name);
                      setOpen(false);
                      onSelect({
                        name: s.name,
                        website: `https://${s.domain}`,
                      });
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50"
                  >
                    <span className="text-zinc-900">{s.name}</span>
                    <span className="truncate text-xs text-zinc-400">
                      {s.domain}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
