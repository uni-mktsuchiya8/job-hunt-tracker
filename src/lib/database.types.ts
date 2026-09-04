export type ApplicationStatus =
  | "検討中"
  | "応募済み"
  | "選考中"
  | "内定"
  | "不合格"
  | "辞退";

export type StageResult = "未定" | "通過" | "不合格" | "辞退" | "保留";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "検討中",
  "応募済み",
  "選考中",
  "内定",
  "不合格",
  "辞退",
];

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

export const STAGE_NAME_SUGGESTIONS = [
  "書類選考",
  "一次面接",
  "二次面接",
  "三次面接",
  "最終面接",
  "オファー面談",
];

export const STAGE_METHODS = ["対面", "オンライン", "電話", "その他"] as const;

export const REMOTE_OPTIONS = [
  "フルリモート",
  "一部リモート",
  "リモート不可",
  "不明",
] as const;

export interface Company {
  id: string;
  user_id: string;
  name: string;
  info: string | null;
  website: string | null;
  job_requirements: string | null;
  salary: string | null;
  work_location: string | null;
  remote_type: string | null;
  priority_rank: number | null;
  priority_reason: string | null;
  application_route: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface InterviewStage {
  id: string;
  company_id: string;
  user_id: string;
  stage_name: string;
  scheduled_at: string | null;
  method: string | null;
  interviewer: string | null;
  conversation_notes: string | null;
  impression: string | null;
  result: StageResult;
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
    };
  };
}
