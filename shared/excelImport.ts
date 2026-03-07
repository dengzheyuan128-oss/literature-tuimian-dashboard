export interface ExcelContext {
  sourceFile: string;
  sheetName: string;
  rowNumber: number;
}

export interface StagingRow {
  source_file: string;
  source_sheet: string;
  source_row: number;
  school_name: string;
  department_name: string;
  program_name_raw: string;
  published_at_raw: string;
  stage: string;
  application_start_raw: string;
  application_end_raw: string;
  requirement_text: string;
  notice_url: string;
  application_method: string;
  ranking_requirement_text: string;
  materials_text: string;
  flags_json: {
    has_application_form: boolean;
    has_resume_requirement: boolean;
    has_personal_statement_requirement: boolean;
    has_paper_or_portfolio_requirement: boolean;
  };
}

const COLUMN_ALIASES: Record<string, string[]> = {
  school_name: ['学校'],
  department_name: ['学院'],
  published_at_raw: ['发布时间'],
  stage: ['招生阶段'],
  application_start_raw: ['报名开始时间'],
  application_end_raw: ['报名结束时间'],
  program_name_raw: ['招生专业'],
  requirement_text: ['申请要求', '本科专业要求'],
  notice_url: ['通知官网链接'],
  application_method: ['报名方式'],
  ranking_requirement_text: ['成绩排名要求'],
  materials_text: ['申请材料要求'],
  application_form: ['申请表'],
  resume_requirement: ['简历'],
  personal_statement_requirement: ['个人陈述'],
  paper_or_portfolio_requirement: ['是否提交论文/作品'],
};

const HEADER_TARGETS = ['学校', '学院', '招生阶段', '通知官网链接'];

export function detectHeaderRow(rows: string[][]): number {
  let bestIndex = -1;
  let bestScore = -1;

  rows.forEach((row, index) => {
    const score = HEADER_TARGETS.reduce((count, header) => {
      return count + (row.some((cell) => normalizeCell(cell) === header) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  if (bestScore < 3) {
    throw new Error('Unable to detect header row');
  }

  return bestIndex;
}

export function createColumnMap(headerRow: string[]): Record<string, number> {
  const map: Record<string, number> = {};

  Object.entries(COLUMN_ALIASES).forEach(([target, aliases]) => {
    const index = headerRow.findIndex((cell) => aliases.includes(normalizeCell(cell)));
    if (index >= 0) {
      map[target] = index;
    }
  });

  return map;
}

export function normalizeRow(
  row: string[],
  columnMap: Record<string, number>,
  context: ExcelContext,
): StagingRow {
  return {
    source_file: context.sourceFile,
    source_sheet: context.sheetName,
    source_row: context.rowNumber,
    school_name: getValue(row, columnMap.school_name),
    department_name: getValue(row, columnMap.department_name),
    program_name_raw: getValue(row, columnMap.program_name_raw),
    published_at_raw: getValue(row, columnMap.published_at_raw),
    stage: getValue(row, columnMap.stage),
    application_start_raw: getValue(row, columnMap.application_start_raw),
    application_end_raw: getValue(row, columnMap.application_end_raw),
    requirement_text: getValue(row, columnMap.requirement_text),
    notice_url: getValue(row, columnMap.notice_url),
    application_method: getValue(row, columnMap.application_method),
    ranking_requirement_text: getValue(row, columnMap.ranking_requirement_text),
    materials_text: getValue(row, columnMap.materials_text),
    flags_json: {
      has_application_form: toFlag(getValue(row, columnMap.application_form)),
      has_resume_requirement: toFlag(getValue(row, columnMap.resume_requirement)),
      has_personal_statement_requirement: toFlag(getValue(row, columnMap.personal_statement_requirement)),
      has_paper_or_portfolio_requirement: toFlag(getValue(row, columnMap.paper_or_portfolio_requirement)),
    },
  };
}

export function hasMeaningfulContent(stagingRow: StagingRow): boolean {
  return Boolean(
    stagingRow.school_name ||
    stagingRow.department_name ||
    stagingRow.program_name_raw ||
    stagingRow.notice_url ||
    stagingRow.requirement_text ||
    stagingRow.materials_text,
  );
}

function getValue(row: string[], index?: number): string {
  if (index === undefined || index < 0) {
    return '';
  }

  return normalizeCell(row[index]);
}

function normalizeCell(value: unknown): string {
  return String(value ?? '').trim();
}

function toFlag(value: string): boolean {
  if (!value) return false;
  if (['未提及', '否', '无', '没有', '/'].includes(value)) return false;
  return true;
}
