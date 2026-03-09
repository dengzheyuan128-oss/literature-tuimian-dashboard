import { describe, expect, it } from 'vitest';

import type { StagingRow } from '@shared/excelImport';
import { buildImportPlan } from '@shared/stagingImport';

describe('stagingImport', () => {
  it('builds raw rows, normalized notices, department entities, and department cards separately', () => {
    const rows: StagingRow[] = [
      {
        source_file: '2025.xlsx',
        source_sheet: 'Sheet1',
        source_row: 2,
        school_name: '中山大学',
        department_name: '历史学系',
        program_name_raw: '中国史',
        published_at_raw: '2025年6月1日',
        stage: '夏令营',
        application_start_raw: '',
        application_end_raw: '',
        requirement_text: '接受相关专业',
        notice_url: 'https://example.com/a',
        application_method: '系统',
        ranking_requirement_text: '',
        materials_text: '',
        flags_json: {
          has_application_form: false,
          has_resume_requirement: false,
          has_personal_statement_requirement: false,
          has_paper_or_portfolio_requirement: false,
        },
      },
      {
        source_file: '2026.xlsx',
        source_sheet: 'Sheet1',
        source_row: 3,
        school_name: '中山大学',
        department_name: '历史学系',
        program_name_raw: '',
        published_at_raw: '2026年6月2日',
        stage: '预推免',
        application_start_raw: '',
        application_end_raw: '',
        requirement_text: '获得推免资格',
        notice_url: 'https://example.com/b',
        application_method: '系统',
        ranking_requirement_text: '',
        materials_text: '',
        flags_json: {
          has_application_form: false,
          has_resume_requirement: false,
          has_personal_statement_requirement: false,
          has_paper_or_portfolio_requirement: false,
        },
      },
    ];

    const plan = buildImportPlan(rows);

    expect(plan.rawExcelRows).toHaveLength(2);
    expect(plan.normalizedNotices).toHaveLength(2);
    expect(plan.departmentEntities).toEqual([
      expect.objectContaining({
        key: '中山大学::历史学系',
        school_name: '中山大学',
        department_name: '历史学系',
      }),
    ]);
    expect(plan.departmentCards).toEqual([
      expect.objectContaining({
        key: '中山大学::历史学系',
        department_entity_key: '中山大学::历史学系',
        current_notice_key: expect.any(String),
        history_notice_keys: expect.arrayContaining([expect.any(String), expect.any(String)]),
      }),
    ]);
  });

  it('keeps notices without urls but excludes them from default card selection', () => {
    const rows: StagingRow[] = [
      {
        source_file: '2026.xlsx',
        source_sheet: 'Sheet1',
        source_row: 2,
        school_name: '北京大学',
        department_name: '中文系',
        program_name_raw: '',
        published_at_raw: '2026年6月1日',
        stage: '预推免',
        application_start_raw: '',
        application_end_raw: '',
        requirement_text: '获得推免资格',
        notice_url: '',
        application_method: '系统',
        ranking_requirement_text: '',
        materials_text: '',
        flags_json: {
          has_application_form: false,
          has_resume_requirement: false,
          has_personal_statement_requirement: false,
          has_paper_or_portfolio_requirement: false,
        },
      },
      {
        source_file: '2026.xlsx',
        source_sheet: 'Sheet1',
        source_row: 3,
        school_name: '北京大学',
        department_name: '中文系',
        program_name_raw: '',
        published_at_raw: '2026年5月20日',
        stage: '夏令营',
        application_start_raw: '',
        application_end_raw: '',
        requirement_text: '接受相关专业',
        notice_url: 'https://example.com/pku',
        application_method: '问卷',
        ranking_requirement_text: '',
        materials_text: '',
        flags_json: {
          has_application_form: false,
          has_resume_requirement: false,
          has_personal_statement_requirement: false,
          has_paper_or_portfolio_requirement: false,
        },
      },
    ];

    const plan = buildImportPlan(rows);

    expect(plan.normalizedNotices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ has_url: false, notice_url: '' }),
        expect.objectContaining({ has_url: true, notice_url: 'https://example.com/pku' }),
      ]),
    );
    expect(plan.departmentCards[0]).toEqual(
      expect.objectContaining({
        current_notice_key: expect.stringContaining('https://example.com/pku'),
      }),
    );
  });

  it('selects the current notice by year, published date, stage priority, then source row', () => {
    const rows: StagingRow[] = [
      {
        source_file: '2026.xlsx',
        source_sheet: 'Sheet1',
        source_row: 5,
        school_name: '复旦大学',
        department_name: '中文系',
        program_name_raw: '',
        published_at_raw: '2026年6月10日',
        stage: '夏令营',
        application_start_raw: '',
        application_end_raw: '',
        requirement_text: '要求一',
        notice_url: 'https://example.com/summer',
        application_method: '系统',
        ranking_requirement_text: '',
        materials_text: '',
        flags_json: {
          has_application_form: false,
          has_resume_requirement: false,
          has_personal_statement_requirement: false,
          has_paper_or_portfolio_requirement: false,
        },
      },
      {
        source_file: '2026.xlsx',
        source_sheet: 'Sheet1',
        source_row: 6,
        school_name: '复旦大学',
        department_name: '中文系',
        program_name_raw: '',
        published_at_raw: '2026年6月10日',
        stage: '预推免',
        application_start_raw: '',
        application_end_raw: '',
        requirement_text: '要求二',
        notice_url: 'https://example.com/pre',
        application_method: '系统',
        ranking_requirement_text: '',
        materials_text: '',
        flags_json: {
          has_application_form: false,
          has_resume_requirement: false,
          has_personal_statement_requirement: false,
          has_paper_or_portfolio_requirement: false,
        },
      },
      {
        source_file: '2025.xlsx',
        source_sheet: 'Sheet1',
        source_row: 9,
        school_name: '复旦大学',
        department_name: '中文系',
        program_name_raw: '',
        published_at_raw: '2025年9月1日',
        stage: '预推免',
        application_start_raw: '',
        application_end_raw: '',
        requirement_text: '旧要求',
        notice_url: 'https://example.com/old',
        application_method: '系统',
        ranking_requirement_text: '',
        materials_text: '',
        flags_json: {
          has_application_form: false,
          has_resume_requirement: false,
          has_personal_statement_requirement: false,
          has_paper_or_portfolio_requirement: false,
        },
      },
      {
        source_file: '2026.xlsx',
        source_sheet: 'Sheet1',
        source_row: 8,
        school_name: '复旦大学',
        department_name: '中文系',
        program_name_raw: '',
        published_at_raw: '2026年6月10日',
        stage: '预推免',
        application_start_raw: '',
        application_end_raw: '',
        requirement_text: '要求三',
        notice_url: 'https://example.com/pre-later-row',
        application_method: '系统',
        ranking_requirement_text: '',
        materials_text: '',
        flags_json: {
          has_application_form: false,
          has_resume_requirement: false,
          has_personal_statement_requirement: false,
          has_paper_or_portfolio_requirement: false,
        },
      },
    ];

    const plan = buildImportPlan(rows);

    expect(plan.departmentCards).toEqual([
      expect.objectContaining({
        key: '复旦大学::中文系',
        current_notice_key: expect.stringContaining('https://example.com/pre-later-row'),
      }),
    ]);
  });
});
