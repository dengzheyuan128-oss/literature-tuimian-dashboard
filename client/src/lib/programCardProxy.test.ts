import { describe, expect, it } from 'vitest';

import type { ProgramCardRecord } from '@/lib/programCards';
import { buildProgramCardApiUrl, mapProxyPayloadToDataset } from '@/lib/programCardProxy';

describe('programCardProxy', () => {
  it('builds api urls with paging and search params', () => {
    expect(buildProgramCardApiUrl({ limit: 24, offset: 48, search: '北京' })).toBe(
      '/api/program-cards?limit=24&offset=48&search=%E5%8C%97%E4%BA%AC',
    );
  });

  it('maps proxy payloads into the card dataset shape', () => {
    const records: ProgramCardRecord[] = [
      {
        id: 'card-1',
        institution_name: 'Peking University',
        department_name: 'Chinese Department',
        program_name: 'Chinese Literature',
        degree_type: 'Academic',
        year: 2026,
        primary_stage: 'Summer Camp',
        specialty_summary: 'Related majors accepted',
        institution_location: 'Beijing',
        institution_is_985: true,
        institution_is_211: true,
        institution_discipline_grade: 'A+',
        latest_notice_url: 'https://example.com/notice',
        latest_notice_title: 'Notice',
        latest_notice_application_start_raw: '2026-06-01',
        latest_notice_application_end_raw: '2026-06-10',
        latest_notice_published_at_raw: '2026-06-02',
        latest_notice_materials_text: 'CV',
        latest_notice_ranking_requirement_text: 'Top 20%',
        latest_notice_english_requirement_text: 'IELTS 7.0',
        latest_notice_application_method: 'System',
      },
    ];

    const dataset = mapProxyPayloadToDataset({
      records,
      hasMore: true,
      configured: true,
      source: 'api',
      error: null,
      lastUpdated: '2026-03-08T12:00:00.000Z',
      supabaseHost: 'example.supabase.co',
    }, 0, 24);

    expect(dataset.source).toBe('api');
    expect(dataset.hasMore).toBe(true);
    expect(dataset.universities[0]?.sourceCardId).toBe('card-1');
    expect(dataset.universities[0]?.name).toBe('Peking University');
  });
});
