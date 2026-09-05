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
  application_route text,   -- 応募経路 (直接応募 / エージェント / リファラル / スカウト / その他)
  status text not null default '検討中', -- 検討中 / 応募済み / 選考中 / 内定 / 不合格 / 辞退
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists interview_stages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  stage_name text not null,     -- 書類選考 / 一次面接 / 二次面接 / 最終面接 / オファー面談 など
  scheduled_at timestamptz,     -- 選考日程
  method text,                  -- 実施方法 (対面 / オンライン / 電話 / その他)
  interviewer text,             -- 面接官名
  conversation_notes text,      -- 会話内容の詳細
  impression text,              -- 面接の印象メモ(所感)
  result text not null default '未定', -- 未定 / 通過 / 不合格 / 辞退 / 保留
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

create index if not exists companies_user_id_idx on companies (user_id);
create index if not exists interview_stages_company_id_idx on interview_stages (company_id);
create index if not exists interview_stages_user_id_idx on interview_stages (user_id);

alter table companies enable row level security;
alter table interview_stages enable row level security;

create policy "Users manage their own companies"
  on companies for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own interview stages"
  on interview_stages for all
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
