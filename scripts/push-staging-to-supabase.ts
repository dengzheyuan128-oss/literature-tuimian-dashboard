import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { createClient } from '@supabase/supabase-js';

import type { StagingRow } from '../shared/excelImport';
import { buildImportPlan } from '../shared/stagingImport';

const projectRoot = path.resolve(import.meta.dirname, '..');
const stagingPath = path.join(projectRoot, 'reports', 'excel-import', 'staging-rows.json');
const BATCH_SIZE = 500;

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const rows = JSON.parse(fs.readFileSync(stagingPath, 'utf8')) as StagingRow[];
  const limitedRows = args.limit ? rows.slice(0, args.limit) : rows;
  const plan = buildImportPlan(limitedRows);

  if (args.dryRun) {
    console.log(
      JSON.stringify(
        {
          mode: 'dry-run',
          limit: args.limit ?? null,
          stats: plan.stats,
          sample: {
            institution: plan.institutions[0] ?? null,
            department: plan.departments[0] ?? null,
            programCard: plan.programCards[0] ?? null,
            notice: plan.notices[0] ?? null,
          },
        },
        null,
        2,
      ),
    );
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

  if (args.reset) {
    await resetImportTables(supabase);
  }

  const institutionIds = new Map(plan.institutions.map((item) => [item.key, crypto.randomUUID()]));
  const departmentIds = new Map(plan.departments.map((item) => [item.key, crypto.randomUUID()]));
  const cardIds = new Map(plan.programCards.map((item) => [item.key, crypto.randomUUID()]));
  const noticeIds = new Map(plan.notices.map((item) => [item.key, crypto.randomUUID()]));

  await insertInBatches(
    supabase,
    'institutions',
    plan.institutions.map((item) => ({
      id: institutionIds.get(item.key),
      name: item.name,
      normalized_name: item.normalized_name,
    })),
  );

  await insertInBatches(
    supabase,
    'departments',
    plan.departments.map((item) => ({
      id: departmentIds.get(item.key),
      institution_id: institutionIds.get(item.institution_key),
      name: item.name,
      normalized_name: item.normalized_name,
    })),
  );

  await insertInBatches(
    supabase,
    'program_cards',
    plan.programCards.map((item) => ({
      id: cardIds.get(item.key),
      institution_id: institutionIds.get(item.institution_key),
      department_id: departmentIds.get(item.department_key) ?? null,
      program_name: item.program_name,
      normalized_program_name: item.normalized_program_name,
      specialty_summary: item.specialty_summary,
      degree_type: item.degree_type,
      year: item.year,
      primary_stage: item.primary_stage,
      card_status: 'published',
    })),
  );

  await insertInBatches(
    supabase,
    'notices',
    plan.notices.map((item) => ({
      id: noticeIds.get(item.key),
      program_card_id: cardIds.get(item.program_card_key),
      title: item.title,
      notice_url: item.notice_url,
      published_at_raw: item.published_at_raw,
      stage: item.stage,
      application_start_raw: item.application_start_raw,
      application_end_raw: item.application_end_raw,
      requirement_text: item.requirement_text,
      ranking_requirement_text: item.ranking_requirement_text,
      english_requirement_text: item.english_requirement_text,
      materials_text: item.materials_text,
      application_method: item.application_method,
      source_channel: item.source_channel,
      source_type: 'official',
      review_status: 'approved',
    })),
  );

  await insertInBatches(
    supabase,
    'notice_sources',
    plan.noticeSources.map((item) => ({
      id: crypto.randomUUID(),
      notice_id: noticeIds.get(item.notice_key),
      source_url: item.source_url,
      source_file: item.source_file,
      source_sheet: item.source_sheet,
      source_row: item.source_row,
      raw_payload: item.raw_payload,
    })),
  );

  console.log(
    JSON.stringify(
      {
        mode: 'import',
        reset: args.reset,
        limit: args.limit ?? null,
        stats: plan.stats,
      },
      null,
      2,
    ),
  );
}

async function resetImportTables(supabase: ReturnType<typeof createClient>) {
  const tables: Array<{ name: string; matchColumn: string }> = [
    { name: 'notice_sources', matchColumn: 'id' },
    { name: 'notices', matchColumn: 'id' },
    { name: 'program_card_tags', matchColumn: 'program_card_id' },
    { name: 'program_cards', matchColumn: 'id' },
    { name: 'departments', matchColumn: 'id' },
    { name: 'institutions', matchColumn: 'id' },
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table.name).delete().not(table.matchColumn, 'is', null);
    if (error) {
      throw error;
    }
  }
}

async function insertInBatches(
  supabase: ReturnType<typeof createClient>,
  table: string,
  rows: Record<string, unknown>[],
) {
  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const batch = rows.slice(index, index + BATCH_SIZE);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      throw new Error(`${table} batch ${index / BATCH_SIZE + 1} failed: ${error.message}`);
    }
  }
}

function parseArgs(args: string[]): { dryRun: boolean; limit?: number; reset: boolean } {
  const dryRun = args.includes('--dry-run');
  const reset = args.includes('--reset');
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex >= 0 ? Number(args[limitIndex + 1]) : undefined;

  return {
    dryRun,
    reset,
    limit: Number.isFinite(limit) ? limit : undefined,
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
