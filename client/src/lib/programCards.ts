import { useEffect, useState } from 'react';

import type { University, DataStatus } from '@/types/university';

import { getCoverageStats, universities as archivedUniversities } from '@/lib/dataLoader';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface ProgramCardRecord {
  id: string;
  institution_name: string;
  department_name: string | null;
  program_name: string;
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
}

export interface ProgramCardFilters {
  search?: string;
  limit?: number;
}

export interface ProgramCardDataset {
  universities: University[];
  coverageStats: ReturnType<typeof buildCoverageStats>;
  lastUpdated: string;
  source: 'supabase' | 'archived-json';
}

const ARCHIVED_LAST_UPDATED = 'archived';

export function mapProgramCardRecordToUniversity(record: ProgramCardRecord, index: number): University {
  const tier = buildTier(record);
  const specialty = record.program_name || record.specialty_summary || record.department_name || '待补充';
  const deadline = record.latest_notice_application_end_raw || '待补充';
  const applicationPeriod = formatApplicationPeriod(
    record.latest_notice_application_start_raw,
    record.latest_notice_application_end_raw,
  );
  const englishRequirement = record.latest_notice_english_requirement_text || '待补充';
  const examForm = record.latest_notice_application_method || '待补充';
  const url = record.latest_notice_url || '';
  const degreeType = record.degree_type || '待补充';
  const dataStatus = inferDataStatus({ specialty, deadline, url, degreeType, applicationPeriod });

  return {
    id: createStableUniversityId(record.id, index),
    sourceCardId: record.id,
    name: record.institution_name,
    tier,
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
    dataVerified: true,
    noticeType: normalizeNoticeType(record.primary_stage),
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
    return buildArchivedDataset();
  }

  try {
    let query = supabase
      .from('program_cards')
      .select(`
        id,
        program_name,
        degree_type,
        year,
        primary_stage,
        specialty_summary,
        institutions:institution_id (
          name,
          location:province,
          is_985,
          is_211,
          discipline_grade
        ),
        departments:department_id (
          name
        ),
        notices (
          notice_url,
          title,
          application_start_raw,
          application_end_raw,
          published_at_raw,
          materials_text,
          ranking_requirement_text,
          english_requirement_text,
          application_method
        )
      `)
      .eq('card_status', 'published')
      .order('updated_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error || !data) {
      return buildArchivedDataset();
    }

    const normalized = data
      .map((row: any) => mapSupabaseRowToProgramCardRecord(row))
      .filter((row): row is ProgramCardRecord => Boolean(row));

    const searched = applySearch(normalized, filters.search);
    const universities = searched.map((row, index) => mapProgramCardRecordToUniversity(row, index + 1));

    return {
      universities,
      coverageStats: buildCoverageStats(universities),
      lastUpdated: new Date().toISOString(),
      source: 'supabase',
    };
  } catch {
    return buildArchivedDataset();
  }
}

export async function getProgramCardById(id: string | number): Promise<University | null> {
  const dataset = await getProgramCards();
  const target = String(id);
  return dataset.universities.find((u) => String(u.sourceCardId ?? u.id) === target) ?? null;
}

export async function getFilterFacets() {
  const dataset = await getProgramCards();
  const tiers = Array.from(new Set(dataset.universities.map((u) => u.tier))).filter(Boolean);
  const noticeTypes = Array.from(new Set(dataset.universities.map((u) => u.noticeType).filter(Boolean)));
  const degreeTypes = Array.from(new Set(dataset.universities.map((u) => u.degreeType).filter(Boolean)));

  return { tiers, noticeTypes, degreeTypes };
}

export function useProgramCards(filters: ProgramCardFilters = {}) {
  const [dataset, setDataset] = useState<ProgramCardDataset>({
    universities: archivedUniversities,
    coverageStats: getCoverageStats(),
    lastUpdated: ARCHIVED_LAST_UPDATED,
    source: 'archived-json',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
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
  }, [filters.limit, filters.search]);

  return {
    ...dataset,
    loading,
  };
}

function buildArchivedDataset(): ProgramCardDataset {
  return {
    universities: archivedUniversities,
    coverageStats: getCoverageStats(),
    lastUpdated: ARCHIVED_LAST_UPDATED,
    source: 'archived-json',
  };
}

function mapSupabaseRowToProgramCardRecord(row: any): ProgramCardRecord | null {
  const institution = Array.isArray(row.institutions) ? row.institutions[0] : row.institutions;
  if (!institution?.name) return null;

  const department = Array.isArray(row.departments) ? row.departments[0] : row.departments;
  const notice = Array.isArray(row.notices) ? row.notices[0] : row.notices;

  return {
    id: row.id,
    institution_name: institution.name,
    department_name: department?.name ?? null,
    program_name: row.program_name,
    degree_type: row.degree_type,
    year: row.year,
    primary_stage: row.primary_stage,
    specialty_summary: row.specialty_summary,
    institution_location: institution.location ?? null,
    institution_is_985: institution.is_985 ?? null,
    institution_is_211: institution.is_211 ?? null,
    institution_discipline_grade: institution.discipline_grade ?? null,
    latest_notice_url: notice?.notice_url ?? null,
    latest_notice_title: notice?.title ?? null,
    latest_notice_application_start_raw: notice?.application_start_raw ?? null,
    latest_notice_application_end_raw: notice?.application_end_raw ?? null,
    latest_notice_published_at_raw: notice?.published_at_raw ?? null,
    latest_notice_materials_text: notice?.materials_text ?? null,
    latest_notice_ranking_requirement_text: notice?.ranking_requirement_text ?? null,
    latest_notice_english_requirement_text: notice?.english_requirement_text ?? null,
    latest_notice_application_method: notice?.application_method ?? null,
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
}): DataStatus {
  const fields = [input.specialty, input.deadline, input.url, input.degreeType, input.applicationPeriod];
  const filled = fields.filter((value) => value && value !== '待补充').length;

  if (filled >= 5) return 'COMPLETE';
  if (filled >= 2) return 'PARTIAL';
  return 'PENDING_MANUAL';
}

function createStableUniversityId(sourceCardId: string, fallbackIndex: number): number {
  let hash = 0;

  for (let i = 0; i < sourceCardId.length; i += 1) {
    hash = (hash * 31 + sourceCardId.charCodeAt(i)) >>> 0;
  }

  const normalized = hash % 2147483647;
  return normalized > 0 ? normalized : fallbackIndex;
}
