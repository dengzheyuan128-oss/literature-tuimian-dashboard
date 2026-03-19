import { describe, expect, it } from 'vitest';

import type { University } from '@/types/university';
import { buildCoverageStats, mapProgramCardRecordToUniversity } from '@/lib/programCards';

describe('programCards', () => {
  it('maps a database card record into the existing university-shaped card model', () => {
    const input = {
      id: 'card-1',
      stable_id: 'dept::history',
      institution_name: 'SYSU',
      department_name: 'History',
      program_name: 'Chinese History',
      notice_type: 'pre_admission',
      application_stage: 'Pre-Admission',
      published_at: '2024-09-01',
      deadline: '2024-09-10',
      availability_status: null,
      eligibility_summary: 'Related majors accepted',
      source_url: 'https://example.com/a',
      verification_status: null,
      last_verified_at: null,
      degree_type: 'Academic',
      year: 2024,
      primary_stage: 'Pre-Admission',
      specialty_summary: 'Related majors accepted',
      institution_location: 'Guangdong',
      institution_is_985: true,
      institution_is_211: true,
      institution_discipline_grade: 'A',
      latest_notice_url: 'https://example.com/a',
      latest_notice_title: '2024 SYSU History Pre-Admission',
      latest_notice_application_start_raw: '2024-09-01',
      latest_notice_application_end_raw: '2024-09-10',
      latest_notice_published_at_raw: '2024-09-05',
      latest_notice_materials_text: 'Form and writing sample',
      latest_notice_ranking_requirement_text: 'Top 30%',
      latest_notice_english_requirement_text: 'CET6 500+',
      latest_notice_application_method: 'System',
      updated_at: '2024-09-12T00:00:00.000Z',
    } as const;

    const result = mapProgramCardRecordToUniversity(input, 1);

    expect(result).toMatchObject<Partial<University & { sourceCardId: string }>>({
      sourceCardId: 'card-1',
      name: 'SYSU',
      tier: '985',
      institutionTags: ['985', '211', '双一流'],
      specialty: 'Chinese History',
      degreeType: 'Academic',
      applicationPeriod: '2024-09-01 - 2024-09-10',
      deadline: '2024-09-10',
      url: 'https://example.com/a',
      dataStatus: 'COMPLETE',
      location: 'Guangdong',
      is985: true,
      is211: true,
      dataVerified: false,
    });

    expect(result.id).toBe(mapProgramCardRecordToUniversity(input, 999).id);
  });

  it('builds coverage stats from the mapped cards', () => {
    const universities: University[] = [
      {
        id: 1,
        name: 'A',
        tier: '985',
        specialty: 'A',
        degreeType: 'Academic',
        examForm: 'System',
        englishRequirement: 'CET6',
        applicationPeriod: '2024-09-01 - 2024-09-10',
        deadline: '2024-09-10',
        url: 'https://a.com',
        dataStatus: 'COMPLETE',
        dataVerified: true,
      },
      {
        id: 2,
        name: 'B',
        tier: '211',
        specialty: 'B',
        degreeType: 'Academic',
        examForm: 'TBD',
        englishRequirement: 'TBD',
        applicationPeriod: 'TBD',
        deadline: 'TBD',
        url: '',
        dataStatus: 'PARTIAL',
        dataVerified: false,
      },
    ];

    expect(buildCoverageStats(universities)).toEqual({
      total: 2,
      complete: 1,
      partial: 1,
      pendingManual: 0,
      completeRate: 50,
    });
  });

  it('treats cards with exam form and english requirement as complete even if one legacy field is missing', () => {
    const input = {
      id: 'card-2',
      institution_name: 'BNU',
      department_name: 'Chinese Department',
      program_name: 'Chinese Language and Literature',
      degree_type: 'Academic',
      year: 2026,
      primary_stage: 'Summer Camp',
      specialty_summary: 'Related majors accepted',
      institution_location: 'Beijing',
      institution_is_985: false,
      institution_is_211: true,
      institution_discipline_grade: 'A',
      latest_notice_url: '',
      latest_notice_title: 'Notice',
      latest_notice_application_start_raw: '2026-06-01',
      latest_notice_application_end_raw: '2026-06-10',
      latest_notice_published_at_raw: '2026-06-02',
      latest_notice_materials_text: 'CV',
      latest_notice_ranking_requirement_text: 'Top 10%',
      latest_notice_english_requirement_text: 'CET6 550+',
      latest_notice_application_method: 'Interview',
    } as const;

    const result = mapProgramCardRecordToUniversity(input, 2);

    expect(result.dataStatus).toBe('COMPLETE');
    expect(result.institutionTags).toContain('211');
    expect(result.institutionTags).toContain('双一流');
  });
  it('backfills key display fields from v1 read-model columns before marking a card as pending', () => {
    const input = {
      id: 'card-3',
      institution_name: 'PKU',
      department_name: '中文系',
      program_name: '',
      deadline: '2026-09-20',
      source_url: 'https://example.com/pku',
      eligibility_summary: '汉语言文学及相关专业可申请',
      degree_type: 'Academic',
      year: 2026,
      primary_stage: 'Pre-Admission',
      specialty_summary: '',
      institution_location: 'Beijing',
      institution_is_985: true,
      institution_is_211: true,
      institution_discipline_grade: 'A+',
      latest_notice_url: '',
      latest_notice_title: 'Notice',
      latest_notice_application_start_raw: '',
      latest_notice_application_end_raw: '',
      latest_notice_published_at_raw: '2026-09-01',
      latest_notice_materials_text: '',
      latest_notice_ranking_requirement_text: '',
      latest_notice_english_requirement_text: '',
      latest_notice_application_method: '',
    } as const;

    const result = mapProgramCardRecordToUniversity(input, 3);

    expect(result.specialty).toBe('汉语言文学及相关专业可申请');
    expect(result.deadline).toBe('2026-09-20');
    expect(result.url).toBe('https://example.com/pku');
    expect(result.dataStatus).toBe('COMPLETE');
  });
});
