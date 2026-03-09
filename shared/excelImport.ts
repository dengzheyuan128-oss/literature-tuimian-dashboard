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
  school_name: ['学校', '学校名称', '院校', '院校名称'],
  department_name: ['学院', '院系', '院系名称', '培养单位', '招生院系'],
  published_at_raw: ['发布时间', '发布日期', '发布年份'],
  stage: ['招生阶段', '项目类型', '招生类型', '申请类型'],
  application_start_raw: ['报名开始时间', '开始时间', '申请开始时间', '开始日期'],
  application_end_raw: ['报名结束时间', '截止时间', '申请截止时间', '截止日期'],
  program_name_raw: ['招生专业', '专业', '专业名称', '招生专业名称'],
  requirement_text: ['申请要求', '本科专业要求', '专业要求', '申请条件', '报名要求'],
  notice_url: ['通知官网链接', '官网链接', '通知链接', '公告链接', '原文链接'],
  application_method: ['报名方式', '考核方式', '考核形式', '复试方式', '选拔方式'],
  ranking_requirement_text: ['成绩排名要求', '成绩排名', '排名要求', '成绩要求（排名）'],
  materials_text: ['申请材料要求', '申请材料', '提交材料', '材料要求'],
  application_form: ['申请表'],
  resume_requirement: ['简历', '个人简历'],
  personal_statement_requirement: ['个人陈述', '自我陈述'],
  paper_or_portfolio_requirement: ['是否提交论文/作品', '论文/作品', '代表作要求'],
};

const HEADER_TARGET_GROUPS = [
  COLUMN_ALIASES.school_name,
  COLUMN_ALIASES.department_name,
  COLUMN_ALIASES.stage,
  COLUMN_ALIASES.notice_url,
];

const EMPTY_LIKE_VALUES = new Set([
  '',
  '/',
  '-',
  '--',
  '无',
  '暂无',
  '暂未公布',
  '暂未发布',
  '未提及',
  '未注明',
  '待定',
  '待补充',
  '待更新',
  '待通知',
  '待确认',
  '另行通知',
]);

const NON_RANKING_PATTERNS = [
  /推免资格/,
  /相关专业/,
  /本科/,
  /报名/,
  /申请/,
  /材料/,
  /英语/,
  /四六级/,
  /cet/i,
  /toefl/i,
  /ielts/i,
];

export function detectHeaderRow(rows: string[][]): number {
  let bestIndex = -1;
  let bestScore = -1;

  rows.forEach((row, index) => {
    const normalizedRow = row.map(normalizeCell);
    const score = HEADER_TARGET_GROUPS.reduce((count, aliases) => {
      return count + (normalizedRow.some((cell) => aliases.includes(cell)) ? 1 : 0);
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
    ranking_requirement_text: normalizeRankingRequirement(getValue(row, columnMap.ranking_requirement_text)),
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

  return normalizeFreeText(row[index]);
}

function normalizeCell(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeFreeText(value: unknown): string {
  const normalized = normalizeCell(value);
  return EMPTY_LIKE_VALUES.has(normalized) ? '' : normalized;
}

function normalizeRankingRequirement(value: string): string {
  if (!value) return '';

  const compact = value.replace(/\s+/g, '');
  const looksLikeRanking =
    /前\d+%/.test(compact) ||
    /前\d+名/.test(compact) ||
    /排名/.test(compact) ||
    /top\s*\d+%/i.test(value) ||
    /top\s*\d+/i.test(value);

  if (looksLikeRanking) {
    return value;
  }

  return NON_RANKING_PATTERNS.some((pattern) => pattern.test(value)) ? '' : value;
}

function toFlag(value: string): boolean {
  return Boolean(value);
}
