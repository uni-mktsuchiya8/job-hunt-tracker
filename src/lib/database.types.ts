export type StageResult = "未定" | "通過" | "不合格" | "辞退" | "保留";

// The default status shown for a company with no 選考ステージ yet — not
// stored anywhere, just what computeCurrentStatus() falls back to.
export const NO_STAGE_STATUS = "検討中";

export const STAGE_RESULTS: StageResult[] = [
  "未定",
  "通過",
  "不合格",
  "辞退",
  "保留",
];

export const APPLICATION_ROUTES = [
  "直接応募",
  "転職エージェント",
  "リファラル",
  "スカウト",
  "転職サイト経由",
  "その他",
] as const;

// Also doubles as the set of "current status" values shown around the
// app (dashboard badges etc.) — 選考ステージ and 選考ステータス are the
// same list now, merged into one section in the UI.
export const STAGE_NAME_SUGGESTIONS = [
  "カジュアル面談",
  "書類選考",
  "一次面接",
  "二次面接",
  "三次面接",
  "最終面接",
  "オファー面談",
  "内定",
  "不合格",
  "辞退",
];

export const STAGE_METHODS = ["対面", "オンライン", "電話", "その他"] as const;

// リモート可能日数(週あたり)。remote_type カラムに "1"〜"5" の文字列で保存する。
export const REMOTE_DAYS_OPTIONS = [
  { value: "1", label: "週1日" },
  { value: "2", label: "週2日" },
  { value: "3", label: "週3日" },
  { value: "4", label: "週4日" },
  { value: "5", label: "週5日(フルリモート)" },
] as const;

export function formatRemoteDays(remoteType: string | null): string | null {
  if (!remoteType) return null;
  const match = REMOTE_DAYS_OPTIONS.find((o) => o.value === remoteType);
  return match ? match.label : remoteType; // fall back to raw value for old data
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  info: string | null;
  website: string | null;
  job_requirements: string | null;
  salary: string | null;
  work_location: string | null;
  nearest_station: string | null;
  remote_type: string | null;
  benefits: string | null;
  overtime_hours: string | null;
  decision_notes: string | null;
  priority_rank: number | null;
  priority_reason: string | null;
  application_route: string | null;
  created_at: string;
  updated_at: string;
}

// 一覧画面から書き込める会社ごとの自由記入メモ。1件保存するたびに新しい行が
// 追加される(上書きではなく蓄積)。
export interface CompanyMemo {
  id: string;
  company_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface InterviewStage {
  id: string;
  company_id: string;
  user_id: string;
  stage_name: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  method: string | null;
  interviewer: string | null;
  conversation_notes: string | null;
  impression: string | null;
  memo: string | null;
  result: StageResult;
  google_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoogleCalendarConnection {
  user_id: string;
  refresh_token: string;
  access_token: string | null;
  access_token_expires_at: string | null;
  calendar_id: string;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: Partial<Company> & { name: string };
        Update: Partial<Company>;
      };
      interview_stages: {
        Row: InterviewStage;
        Insert: Partial<InterviewStage> & {
          company_id: string;
          stage_name: string;
        };
        Update: Partial<InterviewStage>;
      };
      company_memos: {
        Row: CompanyMemo;
        Insert: Partial<CompanyMemo> & { company_id: string; content: string };
        Update: Partial<CompanyMemo>;
      };
    };
  };
}
