-- Job Hunt Tracker schema
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query)

create extension if not exists "pgcrypto";

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  info text,                -- 会社情報 (業界・規模・URLなど自由記述)
  website text,
  job_requirements text,    -- 求人要件 (募集要項を貼り付け・上の構造化項目に無い詳細)
  salary text,              -- 年収
  work_location text,       -- 勤務地
  nearest_station text,     -- 勤務地の最寄駅(自動取得)
  remote_type text,         -- リモート可能日数/週 ("1"〜"5"、5=フルリモート)
  benefits text,            -- 福利厚生
  overtime_hours text,      -- 残業時間の目安
  decision_notes text,      -- 決め手・懸念点(意思決定メモ)
  priority_rank int,        -- 志望順位
  priority_reason text,     -- 志望理由
  job_type text,            -- 職種。job_types テーブルの name を文字列でそのまま保存(外部キーではない)
  application_route text,   -- 応募経路。application_routes テーブルの name を文字列でそのまま保存(外部キーではない)
  memo text,                -- その場のメモ(上書き保存・蓄積しない。蓄積したい場合は company_memos へ)
  registered_at date not null default (now() at time zone 'utc')::date, -- 登録日(経過日数の起点。手動で編集可能)
  status text not null default 'カジュアル面談', -- legacy column, unused by the app (現在のステータスは選考ステージから算出)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists interview_stages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  stage_name text not null,     -- 書類選考 / 一次面接 / 二次面接 / 最終面接 / 内定 など
  scheduled_at timestamptz,     -- 選考日程
  duration_minutes int not null default 60, -- 所要時間(分。Googleカレンダー同期に使用)
  method text,                  -- 実施方法 (対面 / オンライン / 電話 / その他)
  interviewer text,             -- 面接官名
  conversation_notes text,      -- 会話内容の詳細
  impression text,              -- 面接の印象メモ(所感)
  memo text,                    -- 自由記入メモ
  result text not null default '未定', -- 未定 / 通過 / 不合格 / 辞退 / 保留
  google_event_id text,         -- 連携済みGoogleカレンダーの予定ID(自動同期用)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 個別ページの「タイムライン」。上の companies.memo(その場のメモ、上書き)とは
-- 別枠で、保存するたびに1件追加され蓄積されていく経過記録。
create table if not exists company_memos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- 応募経路の自分専用リスト(固定の選択肢ではなく設定ページで追加・削除する)。
-- companies.application_route はここの name を文字列でそのまま保存する。
create table if not exists application_routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- 職種の自分専用リスト(固定の選択肢ではなく設定ページで追加・削除する)。
-- companies.job_type はここの name を文字列でそのまま保存する。
create table if not exists job_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- Googleカレンダー連携(OAuthのリフレッシュトークンを保存)。ユーザーごとに1行。
create table if not exists google_calendar_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,
  calendar_id text not null default 'primary',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Run this if you already created the tables before this update:
-- alter table companies add column if not exists job_requirements text;
-- alter table interview_stages add column if not exists method text;
-- alter table interview_stages add column if not exists interviewer text;
-- alter table interview_stages add column if not exists conversation_notes text;
-- alter table companies add column if not exists salary text;
-- alter table companies add column if not exists work_location text;
-- alter table companies add column if not exists remote_type text;
-- alter table companies add column if not exists priority_rank int;
-- alter table companies add column if not exists priority_reason text;
-- alter table companies add column if not exists benefits text;
-- alter table companies add column if not exists overtime_hours text;
-- alter table companies add column if not exists decision_notes text;
-- alter table companies add column if not exists nearest_station text;
-- 自宅最寄り駅はテーブルではなく、Supabase Authのユーザーメタデータ
-- (home_station) に保存しています。設定ページから登録できます。
-- Note: remote_type previously stored a free-text label (フルリモート等);
-- it now stores "1"〜"5" (weekly remote-capable days). Old text values are
-- simply displayed as-is (formatRemoteDays() falls back to the raw value).
-- alter table interview_stages add column if not exists google_event_id text;
-- alter table interview_stages add column if not exists duration_minutes int not null default 60;
-- alter table interview_stages add column if not exists memo text;
-- alter table companies add column if not exists memo text;
-- 既存プロジェクトでは、上の create table 文はテーブルが無いときしか実行され
-- ないため、company_memos テーブルを追加する場合は以下を実行してください:
-- create table if not exists company_memos (
--   id uuid primary key default gen_random_uuid(),
--   company_id uuid not null references companies (id) on delete cascade,
--   user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
--   content text not null,
--   created_at timestamptz not null default now()
-- );
-- alter table company_memos enable row level security;
-- create policy "Users manage their own company memos"
--   on company_memos for all
--   using (auth.uid() = user_id)
--   with check (auth.uid() = user_id);
-- create index if not exists company_memos_company_id_idx on company_memos (company_id);
-- Note: 選考ステータス(company.status)は使われなくなりました。「現在のステータス」は
-- 選考ステージ一覧から自動計算されます(日程が一番新しいステージ名、無ければ最後に
-- 追加したステージ名)。「選考日程・面接記録」と「ステータス履歴」を1つのセクションに
-- 統合したためです。以前 status_history テーブルを作成済みの場合、アプリはもう
-- 参照しませんが残しておいて問題ありません(消したい場合は下記を実行):
-- drop table if exists status_history;
-- alter table companies add column if not exists registered_at date not null default (now() at time zone 'utc')::date;
-- 既存プロジェクトで application_routes を追加する場合:
-- create table if not exists application_routes (
--   id uuid primary key default gen_random_uuid(),
--   user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
--   name text not null,
--   created_at timestamptz not null default now(),
--   unique (user_id, name)
-- );
-- alter table application_routes enable row level security;
-- create policy "Users manage their own application routes"
--   on application_routes for all
--   using (auth.uid() = user_id)
--   with check (auth.uid() = user_id);
-- 既存の会社に応募経路の初期候補をシード(すでに使ったことがある値をそのまま登録
-- 済みにするだけなので、無くても動作します):
-- insert into application_routes (user_id, name)
-- select distinct user_id, application_route from companies
-- where application_route is not null
-- on conflict (user_id, name) do nothing;
-- 使ったことがまだ無い場合の定番の初期候補が欲しければ、自分の user_id で以下を実行:
-- insert into application_routes (user_id, name)
-- select auth.uid(), r.name
-- from (values ('直接応募'), ('転職エージェント'), ('リファラル'), ('スカウト'), ('転職サイト経由'), ('その他')) as r(name)
-- on conflict (user_id, name) do nothing;
-- 既存プロジェクトで job_type(職種)を追加する場合:
-- alter table companies add column if not exists job_type text;
-- create table if not exists job_types (
--   id uuid primary key default gen_random_uuid(),
--   user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
--   name text not null,
--   created_at timestamptz not null default now(),
--   unique (user_id, name)
-- );
-- alter table job_types enable row level security;
-- create policy "Users manage their own job types"
--   on job_types for all
--   using (auth.uid() = user_id)
--   with check (auth.uid() = user_id);
-- 使ったことがまだ無い場合の定番の初期候補が欲しければ、自分の user_id で以下を実行:
-- insert into job_types (user_id, name)
-- select auth.uid(), j.name
-- from (values ('エンジニア'), ('デザイナー'), ('PM・ディレクター'), ('営業'), ('マーケティング'), ('コーポレート(人事・経理など)')) as j(name)
-- on conflict (user_id, name) do nothing;

create index if not exists companies_user_id_idx on companies (user_id);
create index if not exists interview_stages_company_id_idx on interview_stages (company_id);
create index if not exists interview_stages_user_id_idx on interview_stages (user_id);
create index if not exists company_memos_company_id_idx on company_memos (company_id);

alter table companies enable row level security;
alter table interview_stages enable row level security;
alter table company_memos enable row level security;
alter table application_routes enable row level security;
alter table job_types enable row level security;
alter table google_calendar_connections enable row level security;

create policy "Users manage their own companies"
  on companies for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own interview stages"
  on interview_stages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own company memos"
  on company_memos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own application routes"
  on application_routes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own job types"
  on job_types for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own google calendar connection"
  on google_calendar_connections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Keep updated_at fresh
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists companies_set_updated_at on companies;
create trigger companies_set_updated_at
  before update on companies
  for each row execute function set_updated_at();

drop trigger if exists interview_stages_set_updated_at on interview_stages;
create trigger interview_stages_set_updated_at
  before update on interview_stages
  for each row execute function set_updated_at();

drop trigger if exists google_calendar_connections_set_updated_at on google_calendar_connections;
create trigger google_calendar_connections_set_updated_at
  before update on google_calendar_connections
  for each row execute function set_updated_at();
