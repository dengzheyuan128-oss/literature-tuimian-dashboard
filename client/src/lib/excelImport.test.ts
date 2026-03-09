import { describe, expect, it } from 'vitest';

import { createColumnMap, detectHeaderRow, normalizeRow } from '@shared/excelImport';

describe('excelImport', () => {
  it('detects the real header row after intro rows', () => {
    const rows = [
      ['2025年保研夏令营/预推免申请条件汇总'],
      ['说明文本'],
      ['学校', '学院', '发布时间', '招生阶段', '通知官网链接', '申请表'],
      ['中山大学', '历史学系', '2024年9月5日', '预推免', 'https://example.com', '是'],
    ];

    expect(detectHeaderRow(rows)).toBe(2);
  });

  it('normalizes a row into staging fields and derived flags', () => {
    const header = [
      '学校',
      '学院',
      '发布时间',
      '招生阶段',
      '报名开始时间',
      '报名结束时间',
      '通知官网链接',
      '申请表',
      '简历',
      '个人陈述',
      '是否提交论文/作品',
    ];
    const columnMap = createColumnMap(header);

    const row = [
      '中山大学',
      '历史学系',
      '2024年9月5日',
      '预推免',
      '2024年9月1日',
      '2024年9月10日',
      'https://example.com',
      '是',
      '未提及',
      '是',
      '可提供',
    ];

    expect(
      normalizeRow(row, columnMap, {
        sourceFile: '24年夏令营+预推免申请条件汇总.xlsx',
        sheetName: 'Sheet1',
        rowNumber: 4,
      }),
    ).toEqual({
      source_file: '24年夏令营+预推免申请条件汇总.xlsx',
      source_sheet: 'Sheet1',
      source_row: 4,
      school_name: '中山大学',
      department_name: '历史学系',
      program_name_raw: '',
      published_at_raw: '2024年9月5日',
      stage: '预推免',
      application_start_raw: '2024年9月1日',
      application_end_raw: '2024年9月10日',
      requirement_text: '',
      notice_url: 'https://example.com',
      application_method: '',
      ranking_requirement_text: '',
      materials_text: '',
      flags_json: {
        has_application_form: true,
        has_resume_requirement: false,
        has_personal_statement_requirement: true,
        has_paper_or_portfolio_requirement: true,
      },
    });
  });

  it('maps common alternate headers for directly displayed fields and materials', () => {
    const header = [
      '学校名称',
      '院系',
      '发布日期',
      '项目类型',
      '开始时间',
      '截止时间',
      '官网链接',
      '考核方式',
      '申请材料',
      '成绩排名',
      '专业要求',
    ];
    const columnMap = createColumnMap(header);

    const row = [
      '复旦大学',
      '中文系',
      '2025-09-01',
      '预推免',
      '2025-09-05',
      '2025-09-12',
      'https://example.com/fudan',
      '笔试+面试',
      '成绩单、个人陈述',
      '前10%',
      '汉语言文学相关专业',
    ];

    expect(
      normalizeRow(row, columnMap, {
        sourceFile: 'sample.xlsx',
        sheetName: 'Sheet1',
        rowNumber: 2,
      }),
    ).toMatchObject({
      school_name: '复旦大学',
      department_name: '中文系',
      published_at_raw: '2025-09-01',
      stage: '预推免',
      application_start_raw: '2025-09-05',
      application_end_raw: '2025-09-12',
      notice_url: 'https://example.com/fudan',
      application_method: '笔试+面试',
      materials_text: '成绩单、个人陈述',
      ranking_requirement_text: '前10%',
      requirement_text: '汉语言文学相关专业',
    });
  });

  it('keeps materials text but drops generic non-ranking values from ranking requirement', () => {
    const header = ['学校', '申请材料要求', '成绩排名要求'];
    const columnMap = createColumnMap(header);

    const row = [
      '重庆医科大学',
      '1. 成绩单；2. 英语证明；3. 其他成果',
      '获得推免资格',
    ];

    expect(
      normalizeRow(row, columnMap, {
        sourceFile: 'sample.xlsx',
        sheetName: 'Sheet1',
        rowNumber: 8,
      }),
    ).toMatchObject({
      school_name: '重庆医科大学',
      materials_text: '1. 成绩单；2. 英语证明；3. 其他成果',
      ranking_requirement_text: '',
    });
  });
});
