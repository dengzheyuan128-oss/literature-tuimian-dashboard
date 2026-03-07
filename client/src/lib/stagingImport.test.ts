import { describe, expect, it } from 'vitest';

import type { StagingRow } from '@shared/excelImport';
import { buildImportPlan } from '@shared/stagingImport';

describe('stagingImport', () => {
  it('deduplicates institutions, departments, cards, and keeps notice/source counts', () => {
    const rows: StagingRow[] = [
      {
        source_file: '2024.xlsx',
        source_sheet: 'Sheet1',
        source_row: 2,
        school_name: '中山大学',
        department_name: '历史学系',
        program_name_raw: '中国史、世界史',
        published_at_raw: '2024年9月5日',
        stage: '预推免',
        application_start_raw: '',
        application_end_raw: '',
        requirement_text: '接受相关专业',
        notice_url: 'https://example.com/a',
        application_method: '',
        ranking_requirement_text: '前30%',
        materials_text: '',
        flags_json: {
          has_application_form: false,
          has_resume_requirement: false,
          has_personal_statement_requirement: true,
          has_paper_or_portfolio_requirement: true,
        },
      },
      {
        source_file: '2024.xlsx',
        source_sheet: 'Sheet1',
        source_row: 3,
        school_name: '中山大学',
        department_name: '历史学系',
        program_name_raw: '中国史、世界史',
        published_at_raw: '2024年9月10日',
        stage: '预推免',
        application_start_raw: '',
        application_end_raw: '',
        requirement_text: '接受相关专业',
        notice_url: 'https://example.com/b',
        application_method: '',
        ranking_requirement_text: '前30%',
        materials_text: '',
        flags_json: {
          has_application_form: false,
          has_resume_requirement: false,
          has_personal_statement_requirement: true,
          has_paper_or_portfolio_requirement: true,
        },
      },
      {
        source_file: '2025.xlsx',
        source_sheet: 'Sheet1',
        source_row: 5,
        school_name: '北京大学',
        department_name: '中文系',
        program_name_raw: '',
        published_at_raw: '2025年10月1日',
        stage: '夏令营',
        application_start_raw: '2025年10月1日',
        application_end_raw: '2025年10月10日',
        requirement_text: '获得推免资格',
        notice_url: 'https://example.com/c',
        application_method: '系统',
        ranking_requirement_text: '',
        materials_text: '申请表',
        flags_json: {
          has_application_form: true,
          has_resume_requirement: false,
          has_personal_statement_requirement: false,
          has_paper_or_portfolio_requirement: false,
        },
      },
    ];

    const plan = buildImportPlan(rows);

    expect(plan.institutions).toHaveLength(2);
    expect(plan.departments).toHaveLength(2);
    expect(plan.programCards).toHaveLength(2);
    expect(plan.notices).toHaveLength(3);
    expect(plan.noticeSources).toHaveLength(3);
    expect(plan.stats).toEqual({
      institutions: 2,
      departments: 2,
      programCards: 2,
      notices: 3,
      noticeSources: 3,
    });
  });
});
