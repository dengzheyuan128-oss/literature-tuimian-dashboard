import fs from 'node:fs';
import path from 'node:path';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { StagingRow } from '../shared/excelImport';
import {
  buildImportPlan,
  type ImportDepartment,
  type ImportInstitution,
  type ImportNotice,
  type ImportProgramCard,
} from '../shared/stagingImport';

const projectRoot = path.resolve(import.meta.dirname, '..');
const stagingPath = path.join(projectRoot, 'reports', 'excel-import', 'staging-rows.json');

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const rows = JSON.parse(fs.readFileSync(stagingPath, 'utf8')) as StagingRow[];
  const limitedRows = args.limit ? rows.slice(0, args.limit) : rows;
  const plan = buildImportPlan(limitedRows);

  if (args.dryRun) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      limit: args.limit ?? null,
      stats: plan.stats,
      sample: {
        institution: plan.institutions[0] ?? null,
        department: plan.departments[0] ?? null,
        programCard: plan.programCards[0] ?? null,
        notice: plan.notices[0] ?? null,
      },
    }, null, 2));
    return;
  }

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for non-dry-run import');
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const institutionIds = new Map<string, string>();
  const departmentIds = new Map<string, string>();
  const cardIds = new Map<string, string>();
  const noticeIds = new Map<string, string>();

  for (const institution of plan.institutions) {
    institutionIds.set(institution.key, await upsertInstitution(supabase, institution));
  }

  for (const department of plan.departments) {
    departmentIds.set(department.key, await upsertDepartment(supabase, department, institutionIds));
  }

  for (const card of plan.programCards) {
    cardIds.set(card.key, await upsertProgramCard(supabase, card, institutionIds, departmentIds));
  }

  for (const notice of plan.notices) {
    noticeIds.set(notice.key, await upsertNotice(supabase, notice, cardIds));
  }

  for (const source of plan.noticeSources) {
    const noticeId = noticeIds.get(source.notice_key);
    if (!noticeId) continue;

    const { error } = await supabase
      .from('notice_sources')
      .insert({
        notice_id: noticeId,
        source_url: source.source_url,
        source_file: source.source_file,
        source_sheet: source.source_sheet,
        source_row: source.source_row,
        raw_payload: source.raw_payload,
      });

    if (error) {
      throw error;
    }
  }

  console.log(JSON.stringify({
    mode: 'import',
    limit: args.limit ?? null,
    stats: plan.stats,
  }, null, 2));
}

async function upsertInstitution(client: SupabaseClient, institution: ImportInstitution): Promise<string> {
  const existing = await client
    .from('institutions')
    .select('id')
    .eq('normalized_name', institution.normalized_name)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data?.id) return existing.data.id;

  const created = await client
    .from('institutions')
    .insert({
      name: institution.name,
      normalized_name: institution.normalized_name,
    })
    .select('id')
    .single();

  if (created.error) throw created.error;
  return created.data.id;
}

async function upsertDepartment(
  client: SupabaseClient,
  department: ImportDepartment,
  institutionIds: Map<string, string>,
): Promise<string> {
  const institutionId = institutionIds.get(department.institution_key);
  if (!institutionId) throw new Error(`Missing institution for department ${department.key}`);

  const existing = await client
    .from('departments')
    .select('id')
    .eq('institution_id', institutionId)
    .eq('normalized_name', department.normalized_name)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data?.id) return existing.data.id;

  const created = await client
    .from('departments')
    .insert({
      institution_id: institutionId,
      name: department.name,
      normalized_name: department.normalized_name,
    })
    .select('id')
    .single();

  if (created.error) throw created.error;
  return created.data.id;
}

async function upsertProgramCard(
  client: SupabaseClient,
  card: ImportProgramCard,
  institutionIds: Map<string, string>,
  departmentIds: Map<string, string>,
): Promise<string> {
  const institutionId = institutionIds.get(card.institution_key);
  const departmentId = departmentIds.get(card.department_key) ?? null;
  if (!institutionId) throw new Error(`Missing institution for program card ${card.key}`);

  const existing = await client
    .from('program_cards')
    .select('id')
    .eq('institution_id', institutionId)
    .eq('department_id', departmentId)
    .eq('normalized_program_name', card.normalized_program_name)
    .eq('primary_stage', card.primary_stage)
    .eq('year', card.year)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data?.id) return existing.data.id;

  const created = await client
    .from('program_cards')
    .insert({
      institution_id: institutionId,
      department_id: departmentId,
      program_name: card.program_name,
      normalized_program_name: card.normalized_program_name,
      specialty_summary: card.specialty_summary,
      degree_type: card.degree_type,
      year: card.year,
      primary_stage: card.primary_stage,
    })
    .select('id')
    .single();

  if (created.error) throw created.error;
  return created.data.id;
}

async function upsertNotice(
  client: SupabaseClient,
  notice: ImportNotice,
  cardIds: Map<string, string>,
): Promise<string> {
  const cardId = cardIds.get(notice.program_card_key);
  if (!cardId) throw new Error(`Missing program card for notice ${notice.key}`);

  const existing = await client
    .from('notices')
    .select('id')
    .eq('program_card_id', cardId)
    .eq('notice_url', notice.notice_url)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data?.id) return existing.data.id;

  const created = await client
    .from('notices')
    .insert({
      program_card_id: cardId,
      title: notice.title,
      notice_url: notice.notice_url,
      published_at_raw: notice.published_at_raw,
      stage: notice.stage,
      application_start_raw: notice.application_start_raw,
      application_end_raw: notice.application_end_raw,
      requirement_text: notice.requirement_text,
      ranking_requirement_text: notice.ranking_requirement_text,
      english_requirement_text: notice.english_requirement_text,
      materials_text: notice.materials_text,
      application_method: notice.application_method,
      source_channel: notice.source_channel,
    })
    .select('id')
    .single();

  if (created.error) throw created.error;
  return created.data.id;
}

function parseArgs(args: string[]): { dryRun: boolean; limit?: number } {
  const dryRun = args.includes('--dry-run');
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex >= 0 ? Number(args[limitIndex + 1]) : undefined;
  return {
    dryRun,
    limit: Number.isFinite(limit) ? limit : undefined,
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
