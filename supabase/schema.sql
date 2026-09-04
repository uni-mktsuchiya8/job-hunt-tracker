-- Job Hunt Tracker schema
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query)

create extension if not exists "pgcrypto";

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  info text,                -- 会社情報 (業界・規模・URLなど自由記述)
  website text,
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
  impression text,              -- 面接の印象メモ
  result text not null default '未定', -- 未定 / 通過 / 不合格 / 辞退 / 保留
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
