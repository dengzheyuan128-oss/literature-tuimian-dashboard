-- Program card performance optimization
-- Date: 2026-03-08
-- Purpose:
-- 1. Backfill latest_notice_id so each card can read one latest notice cheaply
-- 2. Add read-oriented indexes for public card and notice queries
-- 3. Expose a flattened public_program_cards view for lightweight frontend reads

create extension if not exists pg_trgm;

create index if not exists program_cards_public_read_idx
  on public.program_cards (card_status, updated_at desc);

create index if not exists program_cards_latest_notice_idx
  on public.program_cards (latest_notice_id);

create index if not exists notices_card_review_published_idx
  on public.notices (program_card_id, review_status, published_at desc, created_at desc);

create index if not exists notices_review_status_idx
  on public.notices (review_status);

create index if not exists institutions_name_trgm_idx
  on public.institutions using gin (name gin_trgm_ops);

create index if not exists departments_name_trgm_idx
  on public.departments using gin (name gin_trgm_ops);

create index if not exists program_cards_name_trgm_idx
  on public.program_cards using gin (program_name gin_trgm_ops);

create index if not exists program_cards_summary_trgm_idx
  on public.program_cards using gin (specialty_summary gin_trgm_ops);

with ranked_notices as (
  select
    n.id as notice_id,
    n.program_card_id,
    row_number() over (
      partition by n.program_card_id
      order by
        n.published_at desc nulls last,
        n.application_end desc nulls last,
        n.created_at desc
    ) as row_num
  from public.notices n
  where n.review_status = 'approved'
)
update public.program_cards pc
set latest_notice_id = rn.notice_id,
    updated_at = now()
from ranked_notices rn
where pc.id = rn.program_card_id
  and rn.row_num = 1
  and pc.latest_notice_id is distinct from rn.notice_id;

create or replace view public.public_program_cards
with (security_invoker = true) as
select
  pc.id,
  i.name as institution_name,
  d.name as department_name,
  pc.program_name,
  pc.degree_type,
  pc.year,
  pc.primary_stage,
  pc.specialty_summary,
  i.province as institution_location,
  i.is_985 as institution_is_985,
  i.is_211 as institution_is_211,
  i.discipline_grade as institution_discipline_grade,
  n.notice_url as latest_notice_url,
  n.title as latest_notice_title,
  n.application_start_raw as latest_notice_application_start_raw,
  n.application_end_raw as latest_notice_application_end_raw,
  n.published_at_raw as latest_notice_published_at_raw,
  n.materials_text as latest_notice_materials_text,
  n.ranking_requirement_text as latest_notice_ranking_requirement_text,
  n.english_requirement_text as latest_notice_english_requirement_text,
  n.application_method as latest_notice_application_method,
  pc.updated_at
from public.program_cards pc
join public.institutions i on i.id = pc.institution_id
left join public.departments d on d.id = pc.department_id
left join public.notices n
  on n.id = pc.latest_notice_id
 and n.review_status = 'approved'
where pc.card_status = 'published';

grant select on public.public_program_cards to anon, authenticated;
