-- Public program card physical read table
-- Date: 2026-03-08
-- Purpose:
-- 1. Provide a stable public read model for card list/search/detail
-- 2. Remove the browser's dependency on the dynamic public_program_cards view
-- 3. Keep public reads limited to published cards and latest approved notices

create extension if not exists pg_trgm;

create table if not exists public.public_program_card_reads (
  id uuid primary key references public.program_cards(id) on delete cascade,
  institution_name text not null,
  department_name text,
  program_name text not null,
  degree_type text,
  year integer,
  primary_stage text,
  specialty_summary text,
  institution_location text,
  institution_is_985 boolean,
  institution_is_211 boolean,
  institution_discipline_grade text,
  latest_notice_url text,
  latest_notice_title text,
  latest_notice_application_start_raw text,
  latest_notice_application_end_raw text,
  latest_notice_published_at_raw text,
  latest_notice_materials_text text,
  latest_notice_ranking_requirement_text text,
  latest_notice_english_requirement_text text,
  latest_notice_application_method text,
  updated_at timestamptz not null default now()
);

create index if not exists public_program_card_reads_updated_idx
  on public.public_program_card_reads (updated_at desc);

create index if not exists public_program_card_reads_institution_trgm_idx
  on public.public_program_card_reads using gin (institution_name gin_trgm_ops);

create index if not exists public_program_card_reads_department_trgm_idx
  on public.public_program_card_reads using gin (department_name gin_trgm_ops);

create index if not exists public_program_card_reads_program_trgm_idx
  on public.public_program_card_reads using gin (program_name gin_trgm_ops);

create index if not exists public_program_card_reads_summary_trgm_idx
  on public.public_program_card_reads using gin (specialty_summary gin_trgm_ops);

insert into public.public_program_card_reads (
  id,
  institution_name,
  department_name,
  program_name,
  degree_type,
  year,
  primary_stage,
  specialty_summary,
  institution_location,
  institution_is_985,
  institution_is_211,
  institution_discipline_grade,
  latest_notice_url,
  latest_notice_title,
  latest_notice_application_start_raw,
  latest_notice_application_end_raw,
  latest_notice_published_at_raw,
  latest_notice_materials_text,
  latest_notice_ranking_requirement_text,
  latest_notice_english_requirement_text,
  latest_notice_application_method,
  updated_at
)
select
  id,
  institution_name,
  department_name,
  program_name,
  degree_type,
  year,
  primary_stage,
  specialty_summary,
  institution_location,
  institution_is_985,
  institution_is_211,
  institution_discipline_grade,
  latest_notice_url,
  latest_notice_title,
  latest_notice_application_start_raw,
  latest_notice_application_end_raw,
  latest_notice_published_at_raw,
  latest_notice_materials_text,
  latest_notice_ranking_requirement_text,
  latest_notice_english_requirement_text,
  latest_notice_application_method,
  now()
from public.public_program_cards
on conflict (id) do update
set
  institution_name = excluded.institution_name,
  department_name = excluded.department_name,
  program_name = excluded.program_name,
  degree_type = excluded.degree_type,
  year = excluded.year,
  primary_stage = excluded.primary_stage,
  specialty_summary = excluded.specialty_summary,
  institution_location = excluded.institution_location,
  institution_is_985 = excluded.institution_is_985,
  institution_is_211 = excluded.institution_is_211,
  institution_discipline_grade = excluded.institution_discipline_grade,
  latest_notice_url = excluded.latest_notice_url,
  latest_notice_title = excluded.latest_notice_title,
  latest_notice_application_start_raw = excluded.latest_notice_application_start_raw,
  latest_notice_application_end_raw = excluded.latest_notice_application_end_raw,
  latest_notice_published_at_raw = excluded.latest_notice_published_at_raw,
  latest_notice_materials_text = excluded.latest_notice_materials_text,
  latest_notice_ranking_requirement_text = excluded.latest_notice_ranking_requirement_text,
  latest_notice_english_requirement_text = excluded.latest_notice_english_requirement_text,
  latest_notice_application_method = excluded.latest_notice_application_method,
  updated_at = now();

alter table public.public_program_card_reads enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'public_program_card_reads'
      and policyname = 'public_program_card_reads_select_policy'
  ) then
    create policy public_program_card_reads_select_policy
      on public.public_program_card_reads
      for select
      to anon, authenticated
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'public_program_card_reads'
      and policyname = 'public_program_card_reads_authenticated_write_policy'
  ) then
    create policy public_program_card_reads_authenticated_write_policy
      on public.public_program_card_reads
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

grant select on public.public_program_card_reads to anon, authenticated;
grant insert, update, delete on public.public_program_card_reads to authenticated;
