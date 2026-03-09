import { describe, expect, it } from 'vitest';

import type { ImportNotice, ImportProgramCard } from '../../../shared/stagingImport';
import { buildLatestNoticeByCardKey, buildProgramCardReadRows } from '../../../shared/programCardReads';

describe('programCardReads', () => {
  it('builds denormalized read rows using each card latest notice', () => {
    const programCards: ImportProgramCard[] = [
      {
        key: 'inst::dept::program::2026::summer',
        institution_key: 'inst',
        department_key: 'inst::dept',
        program_name: 'Chinese Literature',
        normalized_program_name: 'chinese literature',
        specialty_summary: 'Relevant majors accepted',
        degree_type: 'Academic',
        year: 2026,
        primary_stage: 'Summer Camp',
      },
    ];

    const notices: ImportNotice[] = [
      {
        key: 'notice-older',
        program_card_key: 'inst::dept::program::2026::summer',
        title: 'Older Notice',
        notice_url: 'https://example.com/older',
        published_at_raw: '2026-06-01',
        stage: 'Summer Camp',
        application_start_raw: '2026-06-01',
        application_end_raw: '2026-06-10',
        requirement_text: '',
        ranking_requirement_text: 'Top 30%',
        english_requirement_text: 'CET6',
        materials_text: 'CV',
        application_method: 'Form',
        source_channel: 'excel-import',
      },
      {
        key: 'notice-latest',
        program_card_key: 'inst::dept::program::2026::summer',
        title: 'Latest Notice',
        notice_url: 'https://example.com/latest',
        published_at_raw: '2026-06-03',
        stage: 'Summer Camp',
        application_start_raw: '2026-06-03',
        application_end_raw: '2026-06-12',
        requirement_text: '',
        ranking_requirement_text: 'Top 20%',
        english_requirement_text: 'IELTS 7.0',
        materials_text: 'CV and sample',
        application_method: 'System',
        source_channel: 'excel-import',
      },
    ];

    const rows = buildProgramCardReadRows({
      institutions: [
        {
          key: 'inst',
          name: 'Peking University',
          normalized_name: 'peking university',
        },
      ],
      departments: [
        {
          key: 'inst::dept',
          institution_key: 'inst',
          name: 'School of Chinese Language and Literature',
          normalized_name: 'school of chinese language and literature',
        },
      ],
      programCards,
      notices,
      institutionMetadataById: new Map([
        ['card-1', { province: 'Beijing', is_985: true, is_211: true, discipline_grade: 'A+' }],
      ]),
      cardIds: new Map([['inst::dept::program::2026::summer', 'card-1']]),
      latestNoticeByCardKey: new Map([['inst::dept::program::2026::summer', 'notice-latest']]),
      updatedAt: '2026-03-08T08:00:00.000Z',
    });

    expect(rows).toEqual([
      {
        id: 'card-1',
        stable_id: 'inst::dept',
        institution_name: 'Peking University',
        department_name: 'School of Chinese Language and Literature',
        program_name: 'Chinese Literature',
        notice_type: 'summer_camp',
        application_stage: 'Summer Camp',
        published_at: '2026-06-03',
        deadline: '2026-06-12',
        availability_status: null,
        eligibility_summary: 'Relevant majors accepted',
        source_url: 'https://example.com/latest',
        verification_status: null,
        last_verified_at: null,
        degree_type: 'Academic',
        year: 2026,
        primary_stage: 'Summer Camp',
        specialty_summary: 'Relevant majors accepted',
        institution_location: 'Beijing',
        institution_is_985: true,
        institution_is_211: true,
        institution_discipline_grade: 'A+',
        latest_notice_url: 'https://example.com/latest',
        latest_notice_title: 'Latest Notice',
        latest_notice_application_start_raw: '2026-06-03',
        latest_notice_application_end_raw: '2026-06-12',
        latest_notice_published_at_raw: '2026-06-03',
        latest_notice_materials_text: 'CV and sample',
        latest_notice_ranking_requirement_text: 'Top 20%',
        latest_notice_english_requirement_text: 'IELTS 7.0',
        latest_notice_application_method: 'System',
        updated_at: '2026-03-08T08:00:00.000Z',
      },
    ]);
  });

  it('prefers newer year, newer published date, and higher normalized stage priority', () => {
    const latest = buildLatestNoticeByCardKey([
      {
        key: 'summer-2026',
        program_card_key: 'card-a',
        published_at_raw: '2026-06-10',
        application_end_raw: '',
        year: 2026,
        stage_normalized: 'summer_camp',
        source_file: '2026.xlsx',
        source_row: 4,
      },
      {
        key: 'pre-2026',
        program_card_key: 'card-a',
        published_at_raw: '2026-06-10',
        application_end_raw: '',
        year: 2026,
        stage_normalized: 'pre_admission',
        source_file: '2026.xlsx',
        source_row: 5,
      },
      {
        key: 'pre-2025',
        program_card_key: 'card-a',
        published_at_raw: '2025-09-10',
        application_end_raw: '',
        year: 2025,
        stage_normalized: 'pre_admission',
        source_file: '2025.xlsx',
        source_row: 30,
      },
    ]);

    expect(latest.get('card-a')).toBe('pre-2026');
  });
});
