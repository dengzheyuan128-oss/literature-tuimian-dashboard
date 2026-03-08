-- Excel to database schema draft
-- Date: 2026-03-07

create extension if not exists pgcrypto;

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null unique,
  province text,
  city text,
  is_985 boolean default false,
  is_211 boolean default false,
  double_first_class boolean default false,
  discipline_grade text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, normalized_name)
);

create table if not exists public.program_cards (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  program_name text not null,
  normalized_program_name text not null,
  specialty_summary text not null default '',
  degree_type text not null default '',
  year integer,
  primary_stage text not null default '',
  card_status text not null default 'published' check (card_status in ('published', 'archived')),
  latest_notice_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists program_cards_identity_idx
  on public.program_cards (institution_id, department_id, normalized_program_name, coalesce(year, 0), primary_stage);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  program_card_id uuid not null references public.program_cards(id) on delete cascade,
  title text not null default '',
  notice_url text not null,
  published_at_raw text not null default '',
  published_at date,
  stage text not null default '',
  application_start_raw text not null default '',
  application_end_raw text not null default '',
  application_start date,
  application_end date,
  requirement_text text not null default '',
  ranking_requirement_text text not null default '',
  english_requirement_text text not null default '',
  materials_text text not null default '',
  application_method text not null default '',
  source_channel text not null default 'excel-import',
  source_type text not null default 'official',
  review_status text not null default 'approved' check (review_status in ('approved', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists notices_program_url_idx
  on public.notices (program_card_id, notice_url);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'program_cards_latest_notice_fk'
  ) then
    alter table public.program_cards
      add constraint program_cards_latest_notice_fk
      foreign key (latest_notice_id)
      references public.notices(id)
      on delete set null;
  end if;
end $$;

create table if not exists public.notice_sources (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices(id) on delete cascade,
  source_url text not null,
  source_file text,
  source_sheet text,
  source_row integer,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.program_card_tags (
  program_card_id uuid not null references public.program_cards(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (program_card_id, tag_id)
);

create table if not exists public.submission_queue (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid references auth.users(id) on delete set null,
  submitted_url text not null,
  submission_note text not null default '',
  extract_status text not null default 'pending_extract' check (extract_status in ('pending_extract', 'extract_failed', 'pending_review', 'approved', 'rejected', 'merged')),
  review_status text not null default 'pending_review' check (review_status in ('pending_review', 'approved', 'rejected', 'merged')),
  raw_content text not null default '',
  extracted_payload jsonb not null default '{}'::jsonb,
  matched_program_card_id uuid references public.program_cards(id) on delete set null,
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submission_queue(id) on delete cascade,
  reviewer_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('approve', 'reject', 'merge', 'edit')),
  review_note text not null default '',
  before_payload jsonb not null default '{}'::jsonb,
  after_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.institutions enable row level security;
alter table public.departments enable row level security;
alter table public.program_cards enable row level security;
alter table public.notices enable row level security;
alter table public.notice_sources enable row level security;
alter table public.tags enable row level security;
alter table public.program_card_tags enable row level security;
alter table public.submission_queue enable row level security;
alter table public.admin_reviews enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'institutions'
      and policyname = 'Public can read institutions'
  ) then
    create policy "Public can read institutions"
      on public.institutions for select using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'departments'
      and policyname = 'Public can read departments'
  ) then
    create policy "Public can read departments"
      on public.departments for select using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'program_cards'
      and policyname = 'Public can read published cards'
  ) then
    create policy "Public can read published cards"
      on public.program_cards for select using (card_status = 'published');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'notices'
      and policyname = 'Public can read approved notices'
  ) then
    create policy "Public can read approved notices"
      on public.notices for select using (review_status = 'approved');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tags'
      and policyname = 'Public can read tags'
  ) then
    create policy "Public can read tags"
      on public.tags for select using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'program_card_tags'
      and policyname = 'Public can read card tags'
  ) then
    create policy "Public can read card tags"
      on public.program_card_tags for select using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'submission_queue'
      and policyname = 'Users can submit links'
  ) then
    create policy "Users can submit links"
      on public.submission_queue for insert with check (auth.uid() = submitted_by);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'submission_queue'
      and policyname = 'Users can view own submissions'
  ) then
    create policy "Users can view own submissions"
      on public.submission_queue for select using (auth.uid() = submitted_by);
  end if;
end $$;
