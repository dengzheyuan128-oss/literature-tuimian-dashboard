import type { ProgramCardDataset, ProgramCardRecord } from '@/lib/programCards';
import { buildCoverageStats, mapProgramCardRecordToUniversity } from '@/lib/programCards';

export interface ProgramCardProxyPayload {
  records: ProgramCardRecord[];
  hasMore: boolean;
  configured: boolean;
  source: 'api' | 'supabase' | 'supabase-error';
  error: string | null;
  lastUpdated: string;
  supabaseHost: string | null;
}

export function buildProgramCardApiUrl(filters: {
  limit?: number;
  offset?: number;
  search?: string;
  id?: string | number;
}) {
  const params = new URLSearchParams();
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  if (filters.offset !== undefined) params.set('offset', String(filters.offset));
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.id !== undefined) params.set('id', String(filters.id));
  const query = params.toString();
  return query ? `/api/program-cards?${query}` : '/api/program-cards';
}

export function mapProxyPayloadToDataset(
  payload: ProgramCardProxyPayload,
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
  };
}
