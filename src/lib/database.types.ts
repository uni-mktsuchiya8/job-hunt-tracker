export type StageResult = "未定" | "通過" | "不合格" | "辞退" | "保留";

// The default 選考ステータス shown for a company with no 選考予定 yet —
// not stored anywhere, just what computeCurrentStatus() falls back to.
export const NO_STAGE_STATUS = "検討中";

export const STAGE_RESULTS: StageResult[] = [
  "未定",
  "通過",
  "不合格",
  "辞退",
  "保留",
];

// 応募経路は固定の選択肢ではなく、ユーザーが application_routes テーブル
// で自分の選択肢を追加・削除できる(設定ページから管理)。これは新規ユーザー
// 向けの初期値の参考用で、コードからは使わない(SQL側でシードする)。
export const DEFAULT_APPLICATION_ROUTES = [
  "直接応募",
  "転職エージェント",
  "リファラル",
  "スカウト",
  "転職サイト経由",
  "その他",
];

// 職種も応募経路と同じく固定の選択肢ではなく、job_types テーブルで自分の
// 選択肢を追加・削除できる(設定ページから管理)。これも新規ユーザー向け
// の初期値の参考用で、コードからは使わない(SQL側でシードする)。
export const DEFAULT_JOB_TYPES = [
  "エンジニア",
  "デザイナー",
  "PM・ディレクター",
  "営業",
  "マーケティング",
  "コーポレート(人事・経理など)",
];

// Also doubles as the set of 選考ステータス values shown around the app
// (dashboard badges, StatusSelect) — each name here is both a possible
// 選考予定 entry and a possible computed 選考ステータス value.
export const STAGE_NAME_SUGGESTIONS = [
  "カジュアル面談",
  "書類選考",
  "一次面接",
  "二次面接",
  "三次面接",
  "最終面接",
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
  job_type: string | null; // 職種。job_types テーブルの name を文字列でそのまま保存(外部キーではない)
  memo: string | null; // その場のメモ(上書き保存)。蓄積したい記録は company_memos(タイムライン)へ
  registered_at: string; // 登録日(経過日数の起点)。created_at と違い手動で編集できる
  created_at: string;
  updated_at: string;
}

// 応募経路の自分専用リスト(設定ページで追加・削除)。companies.application_route
// にはここにある name をそのまま文字列で保存する(外部キーではない)。
export interface ApplicationRoute {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

// 職種の自分専用リスト(設定ページで追加・削除)。companies.job_type には
// ここにある name をそのまま文字列で保存する(外部キーではない)。
export interface JobType {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

// 個別ページの「タイムライン」。companies.memo(その場のメモ、上書き)とは別枠
// で、1件保存するたびに新しい行が追加される(蓄積)。
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
      application_routes: {
        Row: ApplicationRoute;
        Insert: Partial<ApplicationRoute> & { name: string };
        Update: Partial<ApplicationRoute>;
      };
      job_types: {
        Row: JobType;
        Insert: Partial<JobType> & { name: string };
        Update: Partial<JobType>;
      };
    };
  };
}
