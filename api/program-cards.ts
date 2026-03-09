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
  latest_notice_application_method
`;

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
    const id = asString(req.query.id);
    const search = asString(req.query.search)?.trim();
    const limit = clampInteger(req.query.limit, 24, 1, 100);
    const offset = clampInteger(req.query.offset, 0, 0, 100000);

    let query = supabase
      .from('public_program_card_reads')
      .select(PROGRAM_CARD_READ_SELECT, { count: 'exact' })
      .order('updated_at', { ascending: false });

    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.range(offset, offset + limit);
    }

    if (search) {
      const escaped = escapeLike(search);
      query = query.or([
        `institution_name.ilike.%${escaped}%`,
        `department_name.ilike.%${escaped}%`,
        `program_name.ilike.%${escaped}%`,
        `specialty_summary.ilike.%${escaped}%`,
        `primary_stage.ilike.%${escaped}%`,
      ].join(','));
    }

    const { data, error, count } = await query;

    if (error) {
      res.status(502).json({
        records: [],
        hasMore: false,
        configured: true,
        source: 'supabase-error',
        error: error.message,
        lastUpdated: 'error',
        supabaseHost,
      });
      return;
    }

    const records = Array.isArray(data) ? data : data ? [data] : [];
    res.status(200).json({
      records,
      hasMore: !id && records.length > limit,
      configured: true,
      source: 'api',
      error: null,
      lastUpdated: new Date().toISOString(),
      supabaseHost,
      totalCount: id ? records.length : count ?? records.length,
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
