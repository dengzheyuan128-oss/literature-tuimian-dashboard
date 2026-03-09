import { createClient } from '@supabase/supabase-js';

const PROGRAM_CARD_READ_SELECT = `
  id,
  stable_id,
  institution_name,
  department_name,
  program_name,
  notice_type,
  application_stage,
  published_at,
  deadline,
  availability_status,
  eligibility_summary,
  source_url,
  verification_status,
  last_verified_at,
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
`;

const LEGACY_PROGRAM_CARD_SELECT = `
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
  latest_notice_application_method
`;

type QueryArgs = {
  id?: string;
  search?: string;
  limit: number;
  offset: number;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseHost = getSupabaseHost(url);

  if (!url || !key) {
    res.status(500).json({
      records: [],
      hasMore: false,
      configured: false,
      source: 'supabase-error',
      error: 'Supabase server env missing',
      lastUpdated: 'error',
      supabaseHost,
    });
    return;
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const queryArgs: QueryArgs = {
      id: asString(req.query.id),
      search: asString(req.query.search)?.trim(),
      limit: clampInteger(req.query.limit, 24, 1, 100),
      offset: clampInteger(req.query.offset, 0, 0, 100000),
    };
    const institutionCount = queryArgs.id ? undefined : await queryInstitutionCount(supabase);

    const readTableResult = await queryReadTable(supabase, queryArgs);
    if (readTableResult.data) {
      respondSuccess(res, readTableResult.data, readTableResult.count, queryArgs, supabaseHost, institutionCount);
      return;
    }

    const legacyResult = await queryLegacyView(supabase, queryArgs);
    if (legacyResult.data) {
      respondSuccess(res, legacyResult.data, legacyResult.count, queryArgs, supabaseHost, institutionCount);
      return;
    }

    res.status(502).json({
      records: [],
      hasMore: false,
      configured: true,
      source: 'supabase-error',
      error: legacyResult.error ?? readTableResult.error ?? 'program card query failed',
      lastUpdated: 'error',
      supabaseHost,
    });
  } catch (error) {
    res.status(500).json({
      records: [],
      hasMore: false,
      configured: true,
      source: 'supabase-error',
      error: error instanceof Error ? error.message : 'Unknown server proxy error',
      lastUpdated: 'error',
      supabaseHost,
    });
  }
}

async function queryReadTable(supabase: ReturnType<typeof createClient>, args: QueryArgs) {
  let query = supabase
    .from('public_program_card_reads')
    .select(PROGRAM_CARD_READ_SELECT, { count: 'exact' })
    .order('updated_at', { ascending: false });

  query = applyFilters(query, args);

  const { data, error, count } = await query;
  if (error) {
    return { data: null, count: 0, error: error.message };
  }

  return {
    data: normalizeRecords(data),
    count: count ?? (Array.isArray(data) ? data.length : 0),
    error: null,
  };
}

async function queryLegacyView(supabase: ReturnType<typeof createClient>, args: QueryArgs) {
  let query = supabase
    .from('public_program_cards')
    .select(LEGACY_PROGRAM_CARD_SELECT, { count: 'exact' })
    .order('latest_notice_published_at_raw', { ascending: false, nullsFirst: false });

  query = applyFilters(query, args);

  const { data, error, count } = await query;
  if (error) {
    return { data: null, count: 0, error: error.message };
  }

  return {
    data: normalizeRecords(data),
    count: count ?? (Array.isArray(data) ? data.length : 0),
    error: null,
  };
}

function applyFilters(query: any, args: QueryArgs) {
  if (args.id) {
    return query.eq('id', args.id);
  }

  let nextQuery = query.range(args.offset, args.offset + args.limit);

  if (args.search) {
    const escaped = escapeLike(args.search);
    nextQuery = nextQuery.or([
      `institution_name.ilike.%${escaped}%`,
      `department_name.ilike.%${escaped}%`,
      `program_name.ilike.%${escaped}%`,
      `specialty_summary.ilike.%${escaped}%`,
      `primary_stage.ilike.%${escaped}%`,
    ].join(','));
  }

  return nextQuery;
}

function respondSuccess(
  res: any,
  records: NormalizedProgramCardRecord[],
  count: number,
  args: QueryArgs,
  supabaseHost: string | null,
  institutionCount?: number,
) {
  res.status(200).json({
    records,
    hasMore: !args.id && records.length > args.limit,
    configured: true,
    source: 'api',
    error: null,
    lastUpdated: new Date().toISOString(),
    supabaseHost,
    totalCount: args.id ? records.length : count ?? records.length,
    institutionCount,
  });
}

async function queryInstitutionCount(supabase: ReturnType<typeof createClient>) {
  const { count, error } = await supabase
    .from('institutions')
    .select('id', { count: 'exact', head: true });

  if (error) {
    return undefined;
  }

  return count ?? undefined;
}

type NormalizedProgramCardRecord = {
  id: string;
  stable_id: string | null;
  institution_name: string;
  department_name: string | null;
  program_name: string;
  notice_type: string | null;
  application_stage: string | null;
  published_at: string | null;
  deadline: string | null;
  availability_status: string | null;
  eligibility_summary: string | null;
  source_url: string | null;
  verification_status: string | null;
  last_verified_at: string | null;
  degree_type: string | null;
  year: number | null;
  primary_stage: string | null;
  specialty_summary: string | null;
  institution_location: string | null;
  institution_is_985: boolean | null;
  institution_is_211: boolean | null;
  institution_discipline_grade: string | null;
  latest_notice_url: string | null;
  latest_notice_title: string | null;
  latest_notice_application_start_raw: string | null;
  latest_notice_application_end_raw: string | null;
  latest_notice_published_at_raw: string | null;
  latest_notice_materials_text: string | null;
  latest_notice_ranking_requirement_text: string | null;
  latest_notice_english_requirement_text: string | null;
  latest_notice_application_method: string | null;
  updated_at: string | null;
};

export function normalizeProgramCardRecord(record: Record<string, unknown>): NormalizedProgramCardRecord {
  const institutionName = asNullableString(record.institution_name) ?? '';
  const departmentName = asNullableString(record.department_name);
  const primaryStage = asNullableString(record.primary_stage);
  const specialtySummary = asNullableString(record.specialty_summary);
  const latestNoticeUrl = asNullableString(record.latest_notice_url);

  return {
    id: String(record.id ?? ''),
    stable_id:
      asNullableString(record.stable_id) ??
      [institutionName, departmentName || '未分学院'].join('::'),
    institution_name: institutionName,
    department_name: departmentName,
    program_name:
      asNullableString(record.program_name) ??
      specialtySummary ??
      departmentName ??
      '待补充',
    notice_type:
      asNullableString(record.notice_type) ??
      normalizeNoticeType(primaryStage),
    application_stage:
      asNullableString(record.application_stage) ??
      primaryStage,
    published_at:
      asNullableString(record.published_at) ??
      asNullableString(record.latest_notice_published_at_raw),
    deadline:
      asNullableString(record.deadline) ??
      asNullableString(record.latest_notice_application_end_raw),
    availability_status: asNullableString(record.availability_status),
    eligibility_summary:
      asNullableString(record.eligibility_summary) ??
      specialtySummary,
    source_url:
      asNullableString(record.source_url) ??
      latestNoticeUrl,
    verification_status: asNullableString(record.verification_status),
    last_verified_at: asNullableString(record.last_verified_at),
    degree_type: asNullableString(record.degree_type),
    year: typeof record.year === 'number' ? record.year : null,
    primary_stage: primaryStage,
    specialty_summary: specialtySummary,
    institution_location: asNullableString(record.institution_location),
    institution_is_985: asNullableBoolean(record.institution_is_985),
    institution_is_211: asNullableBoolean(record.institution_is_211),
    institution_discipline_grade: asNullableString(record.institution_discipline_grade),
    latest_notice_url: latestNoticeUrl,
    latest_notice_title: asNullableString(record.latest_notice_title),
    latest_notice_application_start_raw: asNullableString(record.latest_notice_application_start_raw),
    latest_notice_application_end_raw: asNullableString(record.latest_notice_application_end_raw),
    latest_notice_published_at_raw: asNullableString(record.latest_notice_published_at_raw),
    latest_notice_materials_text: asNullableString(record.latest_notice_materials_text),
    latest_notice_ranking_requirement_text: asNullableString(record.latest_notice_ranking_requirement_text),
    latest_notice_english_requirement_text: asNullableString(record.latest_notice_english_requirement_text),
    latest_notice_application_method: asNullableString(record.latest_notice_application_method),
    updated_at: asNullableString(record.updated_at),
  };
}

function normalizeRecords(data: unknown): NormalizedProgramCardRecord[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .filter((row): row is Record<string, unknown> => Boolean(row))
    .map(normalizeProgramCardRecord)
    .filter((row) => Boolean(row.id) && Boolean(row.institution_name));
}

function normalizeNoticeType(stage: string | null) {
  if (!stage) return null;
  const value = stage.toLowerCase();
  if (value.includes('预推') || value.includes('推免') || value.includes('pre')) return 'pre_admission';
  if (value.includes('夏令') || value.includes('summer')) return 'summer_camp';
  if (value.includes('冬令') || value.includes('winter')) return 'winter_camp';
  return 'unknown';
}

function asNullableString(input: unknown): string | null {
  return typeof input === 'string' && input.trim() ? input : null;
}

function asNullableBoolean(input: unknown): boolean | null {
  return typeof input === 'boolean' ? input : null;
}

function clampInteger(input: unknown, fallback: number, min: number, max: number) {
  const value = Number(input);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function asString(input: unknown): string | undefined {
  if (typeof input === 'string') return input;
  if (Array.isArray(input) && typeof input[0] === 'string') return input[0];
  return undefined;
}

function getSupabaseHost(url?: string) {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function escapeLike(value: string) {
  return value.replace(/[,%]/g, '');
}
