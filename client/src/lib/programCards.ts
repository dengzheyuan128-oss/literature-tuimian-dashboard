import { useEffect, useState } from 'react';

import type { University, DataStatus } from '@/types/university';

import { getCoverageStats, universities as archivedUniversities } from '@/lib/dataLoader';
import { getInstitutionTags, getPrimaryInstitutionTier } from '@/lib/institutionTags';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface ProgramCardRecord {
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
}

export interface ProgramCardFilters {
  search?: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export interface ProgramCardDataset {
  universities: University[];
  coverageStats: ReturnType<typeof buildCoverageStats>;
  lastUpdated: string;
  source: 'api' | 'supabase' | 'archived-json' | 'supabase-loading' | 'supabase-error';
  configured: boolean;
  error: string | null;
  supabaseHost: string | null;
  hasMore: boolean;
  totalCount?: number;
  institutionCount?: number;
}

const PLACEHOLDER_TEXT = '???';

const ARCHIVED_LAST_UPDATED = 'archived';
const DEFAULT_BROWSE_LIMIT = 60;
const DEFAULT_SEARCH_LIMIT = 20;
const CACHE_TTL_MS = 30_000;
const QUERY_TIMEOUT_MS = 8_000;
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

type CacheEntry = {
  dataset?: ProgramCardDataset;
  promise?: Promise<ProgramCardDataset>;
  timestamp: number;
};

const datasetCache = new Map<string, CacheEntry>();

export function mapProgramCardRecordToUniversity(record: ProgramCardRecord, index: number): University {
  const institutionTags = getInstitutionTags(record.institution_name, {
    tier: buildTier(record),
    is985: Boolean(record.institution_is_985),
    is211: Boolean(record.institution_is_211),
  });
  const tier = getPrimaryInstitutionTier(institutionTags, buildTier(record));
  const specialty =
    firstPresent(record.program_name, record.specialty_summary, record.eligibility_summary, record.department_name) ||
    PLACEHOLDER_TEXT;
  const deadline = firstPresent(record.deadline, record.latest_notice_application_end_raw) || PLACEHOLDER_TEXT;
  const applicationPeriod = formatApplicationPeriod(
    record.latest_notice_application_start_raw,
    record.latest_notice_application_end_raw || record.deadline,
  );
  const englishRequirement = firstPresent(record.latest_notice_english_requirement_text) || PLACEHOLDER_TEXT;
  const examForm = firstPresent(record.latest_notice_application_method) || PLACEHOLDER_TEXT;
  const url = firstPresent(record.source_url, record.latest_notice_url) || '';
  const degreeType = firstPresent(record.degree_type) || PLACEHOLDER_TEXT;
  const isVerified = isVerifiedRecord(record);
  const dataStatus = inferDataStatus({
    specialty,
    deadline,
    url,
    degreeType,
    applicationPeriod,
    examForm,
    englishRequirement,
  });

  return {
    id: createStableUniversityId(record.stable_id ?? record.id, index),
    sourceCardId: record.id,
    name: record.institution_name,
    tier,
    institutionTags,
    location: record.institution_location || undefined,
    is985: record.institution_is_985 ?? undefined,
    is211: record.institution_is_211 ?? undefined,
    disciplineGrade: record.institution_discipline_grade || undefined,
    specialty,
    degreeType,
    examForm,
    englishRequirement,
    applicationPeriod,
    deadline,
    url,
    dataStatus,
    dataVerified: isVerified,
    noticeType: normalizeNoticeType(record.notice_type ?? record.application_stage ?? record.primary_stage),
    sourceChannel: 'supabase',
    duration: record.year ? `${record.year}` : undefined,
  };
}

export function buildCoverageStats(universities: University[]) {
  const total = universities.length;
  const complete = universities.filter((u) => u.dataStatus === 'COMPLETE').length;
  const partial = universities.filter((u) => u.dataStatus === 'PARTIAL').length;
  const pendingManual = universities.filter((u) => u.dataStatus === 'PENDING_MANUAL').length;

  return {
    total,
    complete,
    partial,
    pendingManual,
    completeRate: total > 0 ? Math.round((complete / total) * 100) : 0,
  };
}

export async function getProgramCards(filters: ProgramCardFilters = {}): Promise<ProgramCardDataset> {
  if (!supabase || !isSupabaseConfigured) {
    return shouldAllowArchivedFallback()
      ? buildArchivedDataset('Supabase env missing')
      : buildSupabaseErrorDataset('Supabase env missing');
  }

  const normalizedFilters = normalizeFilters(filters);
  const cacheKey = buildCacheKey(normalizedFilters);
  const cached = datasetCache.get(cacheKey);
  const now = Date.now();

  if (cached?.dataset && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.dataset;
  }

  if (cached?.promise) {
    return cached.promise;
  }

  const promise = fetchProgramCards(normalizedFilters)
    .then((dataset) => {
      datasetCache.set(cacheKey, {
        dataset,
        timestamp: Date.now(),
      });
      return dataset;
    })
    .catch((error) => {
      datasetCache.delete(cacheKey);
      throw error;
    });

  datasetCache.set(cacheKey, { promise, timestamp: now });
  return promise;
}

async function fetchProgramCards(
  filters: Required<Pick<ProgramCardFilters, 'limit' | 'offset'>> & Pick<ProgramCardFilters, 'search'>,
): Promise<ProgramCardDataset> {
  if (shouldUseProgramCardProxy()) {
    return fetchProgramCardsViaApi(filters);
  }

  const client = supabase;
  if (!client) {
    return buildArchivedDataset('Supabase client unavailable');
  }

  const readModelUnavailableMessage = 'Public read model unavailable';

  try {
    const readTableDataset = await withTimeout(
      queryProgramCardReads(filters),
      QUERY_TIMEOUT_MS,
      'public_program_card_reads query timed out',
    );
    if (readTableDataset) {
      return readTableDataset;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'public_program_card_reads query timed out';
    try {
      const fallbackViewDataset = await withTimeout(
        queryProgramCardsView(filters),
        QUERY_TIMEOUT_MS,
        'public_program_cards query timed out',
      );
      if (fallbackViewDataset) {
        return fallbackViewDataset;
      }
    } catch {
      return buildSupabaseErrorDataset(message);
    }

    return buildSupabaseErrorDataset(message || readModelUnavailableMessage);
  }

  try {
    const viewDataset = await withTimeout(
      queryProgramCardsView(filters),
      QUERY_TIMEOUT_MS,
      'public_program_cards query timed out',
    );
    if (viewDataset) {
      return viewDataset;
    }
  } catch (error) {
    return buildSupabaseErrorDataset(
      error instanceof Error ? error.message : 'public_program_cards query timed out',
    );
  }

  return buildSupabaseErrorDataset(readModelUnavailableMessage);
}

export async function getProgramCardById(id: string | number): Promise<University | null> {
  const target = String(id);

  if (shouldUseProgramCardProxy()) {
    const proxyRecord = await fetchProgramCardByIdViaApi(target);
    if (proxyRecord) {
      return mapProgramCardRecordToUniversity(proxyRecord, 1);
    }
  }

  if (supabase && isSupabaseConfigured) {
    const record = await queryProgramCardReadById(target);
    if (record) {
      return mapProgramCardRecordToUniversity(record, 1);
    }

    const viewRecord = await queryProgramCardViewById(target);
    if (viewRecord) {
      return mapProgramCardRecordToUniversity(viewRecord, 1);
    }

    return null;
  }

  if (!shouldAllowArchivedFallback()) {
    return null;
  }

  return (archivedUniversities as University[]).find((u) => String(u.sourceCardId ?? u.id) === target) ?? null;
}

export async function getFilterFacets() {
  const dataset = await getProgramCards();
  const tiers = Array.from(new Set(dataset.universities.map((u) => u.tier))).filter(Boolean);
  const noticeTypes = Array.from(new Set(dataset.universities.map((u) => u.noticeType).filter(Boolean)));
  const degreeTypes = Array.from(new Set(dataset.universities.map((u) => u.degreeType).filter(Boolean)));

  return { tiers, noticeTypes, degreeTypes };
}

export function useProgramCards(filters: ProgramCardFilters = {}) {
  const allowArchivedFallback = shouldAllowArchivedFallback();
  const [dataset, setDataset] = useState<ProgramCardDataset>({
    universities: isSupabaseConfigured || !allowArchivedFallback ? [] : archivedUniversities,
    coverageStats: isSupabaseConfigured || !allowArchivedFallback
      ? buildCoverageStats([])
      : getCoverageStats(),
    lastUpdated: isSupabaseConfigured || !allowArchivedFallback ? 'loading' : ARCHIVED_LAST_UPDATED,
    source: isSupabaseConfigured || !allowArchivedFallback ? 'supabase-loading' : 'archived-json',
    configured: isSupabaseConfigured,
    error: !isSupabaseConfigured && !allowArchivedFallback ? 'Supabase env missing' : null,
    supabaseHost: getSupabaseHost(),
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (filters.enabled === false) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const nextDataset = await getProgramCards(filters);
      if (!cancelled) {
        setDataset(nextDataset);
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [filters.enabled, filters.limit, filters.offset, filters.search]);

  return {
    ...dataset,
    loading,
  };
}

function buildArchivedDataset(error: string | null = null): ProgramCardDataset {
  return {
    universities: archivedUniversities,
    coverageStats: getCoverageStats(),
    lastUpdated: ARCHIVED_LAST_UPDATED,
    source: 'archived-json',
    configured: isSupabaseConfigured,
    error,
    supabaseHost: getSupabaseHost(),
    hasMore: false,
    totalCount: archivedUniversities.length,
  };
}

async function queryProgramCardsView(
  filters: Required<Pick<ProgramCardFilters, 'limit' | 'offset'>> & Pick<ProgramCardFilters, 'search'>,
): Promise<ProgramCardDataset | null> {
  const client = supabase;
  if (!client) {
    return null;
  }

  try {
    let query = client
      .from('public_program_cards')
      .select(PROGRAM_CARD_READ_SELECT, { count: 'exact' })
      .order('latest_notice_published_at_raw', { ascending: false, nullsFirst: false })
      .range(filters.offset, filters.offset + filters.limit);

    const term = filters.search?.trim();
    if (term) {
      const escaped = escapeLike(term);
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
      return null;
    }

    const normalized = (data ?? []).filter((row: any): row is ProgramCardRecord => Boolean(row?.institution_name));
    const hasMore = normalized.length > filters.limit;
    const universities = normalized
      .slice(0, filters.limit)
      .map((row, index) => mapProgramCardRecordToUniversity(row, filters.offset + index + 1));

    return {
      universities,
      coverageStats: buildCoverageStats(universities),
      lastUpdated: new Date().toISOString(),
      source: 'supabase',
      configured: true,
      error: null,
      supabaseHost: getSupabaseHost(),
      hasMore,
      totalCount: count ?? undefined,
    };
  } catch {
    return null;
  }
}

async function queryProgramCardReads(
  filters: Required<Pick<ProgramCardFilters, 'limit' | 'offset'>> & Pick<ProgramCardFilters, 'search'>,
): Promise<ProgramCardDataset | null> {
  const client = supabase;
  if (!client) {
    return null;
  }

  try {
    let query = client
      .from('public_program_card_reads')
      .select(PROGRAM_CARD_READ_SELECT, { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(filters.offset, filters.offset + filters.limit);

    const term = filters.search?.trim();
    if (term) {
      const escaped = escapeLike(term);
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
      return null;
    }

    return buildSupabaseDatasetFromRecords(
      (data ?? []) as ProgramCardRecord[],
      filters.offset,
      filters.limit,
      count ?? undefined,
    );
  } catch {
    return null;
  }
}

async function queryProgramCardReadById(id: string): Promise<ProgramCardRecord | null> {
  const client = supabase;
  if (!client) {
    return null;
  }

  try {
    const { data, error } = await withTimeout(
      client
        .from('public_program_card_reads')
        .select(PROGRAM_CARD_READ_SELECT)
        .eq('id', id)
        .maybeSingle(),
      QUERY_TIMEOUT_MS,
      'public_program_card_reads detail query timed out',
    );

    if (error || !data) {
      return null;
    }

    return data as ProgramCardRecord;
  } catch {
    return null;
  }
}

async function queryProgramCardViewById(id: string): Promise<ProgramCardRecord | null> {
  const client = supabase;
  if (!client) {
    return null;
  }

  try {
    const { data, error } = await withTimeout(
      client
        .from('public_program_cards')
        .select(PROGRAM_CARD_READ_SELECT)
        .eq('id', id)
        .maybeSingle(),
      QUERY_TIMEOUT_MS,
      'public_program_cards detail query timed out',
    );

    if (error || !data) {
      return null;
    }

    return data as ProgramCardRecord;
  } catch {
    return null;
  }
}

function buildSupabaseErrorDataset(error: string): ProgramCardDataset {
  return {
    universities: [],
    coverageStats: buildCoverageStats([]),
    lastUpdated: 'error',
    source: 'supabase-error',
    configured: true,
    error,
    supabaseHost: getSupabaseHost(),
    hasMore: false,
    totalCount: 0,
  };
}

async function fetchProgramCardsViaApi(
  filters: Required<Pick<ProgramCardFilters, 'limit' | 'offset'>> & Pick<ProgramCardFilters, 'search'>,
): Promise<ProgramCardDataset> {
  try {
    const response = await fetchWithTimeout(buildProgramCardApiUrl(filters), QUERY_TIMEOUT_MS);
    if (!response.ok) {
      return buildSupabaseErrorDataset(`program card api ${response.status}`);
    }

    const payload = await response.json() as {
      records: ProgramCardRecord[];
      hasMore: boolean;
      configured: boolean;
      source: 'api' | 'supabase-error';
      error: string | null;
      lastUpdated: string;
      supabaseHost: string | null;
    };

    return buildProxyDataset(payload, filters.offset, filters.limit);
  } catch (error) {
    return buildSupabaseErrorDataset(error instanceof Error ? error.message : 'program card api query timed out');
  }
}

async function fetchProgramCardByIdViaApi(id: string): Promise<ProgramCardRecord | null> {
  try {
    const response = await fetchWithTimeout(buildProgramCardApiUrl({ id }), QUERY_TIMEOUT_MS);
    if (!response.ok) {
      return null;
    }

    const payload = await response.json() as { records: ProgramCardRecord[] };
    return payload.records?.[0] ?? null;
  } catch {
    return null;
  }
}

function buildSupabaseDatasetFromRecords(
  records: ProgramCardRecord[],
  offset: number,
  limit: number,
  totalCount?: number,
): ProgramCardDataset {
  const normalized = records.filter((row): row is ProgramCardRecord => Boolean(row?.institution_name));
  const hasMore = normalized.length > limit;
  const universities = normalized
    .slice(0, limit)
    .map((row, index) => mapProgramCardRecordToUniversity(row, offset + index + 1));

  return {
    universities,
    coverageStats: buildCoverageStats(universities),
    lastUpdated: new Date().toISOString(),
    source: 'supabase',
    configured: true,
    error: null,
    supabaseHost: getSupabaseHost(),
    hasMore,
    totalCount,
  };
}

function buildProxyDataset(
  payload: {
    records: ProgramCardRecord[];
    hasMore: boolean;
    configured: boolean;
    source: 'api' | 'supabase-error';
    error: string | null;
    lastUpdated: string;
    supabaseHost: string | null;
    totalCount?: number;
  },
  offset: number,
  limit: number,
): ProgramCardDataset {
  const universities = payload.records
    .slice(0, limit)
    .map((row, index) => mapProgramCardRecordToUniversity(row, offset + index + 1));

  return {
    universities,
    coverageStats: buildCoverageStats(universities),
    lastUpdated: payload.lastUpdated,
    source: payload.source,
    configured: payload.configured,
    error: payload.error,
    supabaseHost: payload.supabaseHost,
    hasMore: payload.hasMore,
    totalCount: payload.totalCount,
  };
}

function applySearch(records: ProgramCardRecord[], search?: string): ProgramCardRecord[] {
  const term = search?.trim().toLowerCase();
  if (!term) return records;

  return records.filter((record) => {
    return [
      record.institution_name,
      record.department_name,
      record.program_name,
      record.specialty_summary,
      record.primary_stage,
    ].some((field) => field?.toLowerCase().includes(term));
  });
}

function normalizeFilters(
  filters: ProgramCardFilters,
): Required<Pick<ProgramCardFilters, 'limit' | 'offset'>> & Pick<ProgramCardFilters, 'search'> {
  const hasSearch = Boolean(filters.search?.trim());
  return {
    search: filters.search?.trim() || undefined,
    limit: filters.limit ?? (hasSearch ? DEFAULT_SEARCH_LIMIT : DEFAULT_BROWSE_LIMIT),
    offset: filters.offset ?? 0,
  };
}

function buildCacheKey(
  filters: Required<Pick<ProgramCardFilters, 'limit' | 'offset'>> & Pick<ProgramCardFilters, 'search'>,
) {
  return JSON.stringify({
    search: filters.search ?? '',
    limit: filters.limit,
    offset: filters.offset,
  });
}

function escapeLike(value: string) {
  return value.replace(/[,%]/g, '');
}

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, message: string): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

async function fetchWithTimeout(input: RequestInfo | URL, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('program card api query timed out');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function buildProgramCardApiUrl(filters: { limit?: number; offset?: number; search?: string; id?: string | number }) {
  const params = new URLSearchParams();
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  if (filters.offset !== undefined) params.set('offset', String(filters.offset));
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.id !== undefined) params.set('id', String(filters.id));
  const query = params.toString();
  return query ? `/api/program-cards?${query}` : '/api/program-cards';
}

function shouldUseProgramCardProxy() {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname !== 'localhost' && hostname !== '127.0.0.1';
}

function buildTier(record: ProgramCardRecord): string {
  if (record.institution_is_985) return '985';
  if (record.institution_is_211) return '211';
  return record.institution_discipline_grade || '普通';
}

function formatApplicationPeriod(start?: string | null, end?: string | null): string {
  const left = start?.trim();
  const right = end?.trim();
  if (left && right) return `${left} - ${right}`;
  return left || right || '待补充';
}

function normalizeNoticeType(stage?: string | null): University['noticeType'] {
  if (!stage) return undefined;
  if (stage.includes('夏')) return '夏令营';
  if (stage.includes('预') || stage.includes('推') || stage.includes('免')) return '预推免';
  return '综合';
}

function inferDataStatus(input: {
  specialty: string;
  deadline: string;
  url: string;
  degreeType: string;
  applicationPeriod: string;
  examForm?: string;
  englishRequirement?: string;
}): DataStatus {
  const fields = [
    input.specialty,
    input.deadline,
    input.url,
    input.degreeType,
    input.applicationPeriod,
    input.examForm,
    input.englishRequirement,
  ];
  const filled = fields.filter(isFilledValue).length;

  if (filled >= 5) return 'COMPLETE';
  if (filled >= 3) return 'PARTIAL';
  return 'PENDING_MANUAL';
}

function firstPresent(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim();
}

function isVerifiedRecord(record: ProgramCardRecord) {
  if (record.verification_status) {
    const normalized = record.verification_status.trim().toLowerCase();
    if (['verified', 'official', 'trusted', 'reviewed'].includes(normalized)) {
      return true;
    }
  }

  return Boolean(record.last_verified_at);
}

function isFilledValue(value: string | undefined) {
  if (!value) return false;
  const normalized = value.trim();
  if (!normalized) return false;
  return ![PLACEHOLDER_TEXT, '???', 'TBD', 'Unknown', '??'].includes(normalized);
}

function createStableUniversityId(sourceCardId: string, fallbackIndex: number): number {
  let hash = 0;

  for (let i = 0; i < sourceCardId.length; i += 1) {
    hash = (hash * 31 + sourceCardId.charCodeAt(i)) >>> 0;
  }

  const normalized = hash % 2147483647;
  return normalized > 0 ? normalized : fallbackIndex;
}

function getSupabaseHost(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) return null;

  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function shouldAllowArchivedFallback() {
  if (!import.meta.env.DEV) {
    return false;
  }

  if (typeof window === 'undefined') {
    return true;
  }

  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}
