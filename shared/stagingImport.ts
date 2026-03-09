import type { StagingRow } from './excelImport';

export interface RawExcelRow {
  key: string;
  source_file: string;
  source_sheet: string;
  source_row: number;
  raw_payload: StagingRow;
}

export interface ImportInstitution {
  key: string;
  name: string;
  normalized_name: string;
}

export interface DepartmentEntity {
  key: string;
  institution_key: string;
  school_name: string;
  school_name_normalized: string;
  department_name: string;
  department_name_normalized: string;
}

export interface ImportDepartment extends DepartmentEntity {
  name: string;
  normalized_name: string;
}

export type StageNormalized =
  | 'pre_admission'
  | 'summer_camp'
  | 'winter_camp'
  | 'other'
  | 'unknown';

export interface NormalizedNotice {
  key: string;
  department_entity_key: string;
  raw_row_key: string;
  school_name: string;
  school_name_normalized: string;
  department_name: string;
  department_name_normalized: string;
  notice_url: string;
  has_url: boolean;
  published_at_raw: string;
  stage_raw: string;
  stage_normalized: StageNormalized;
  application_method_raw: string;
  requirement_text: string;
  application_start_raw: string;
  application_end_raw: string;
  ranking_requirement_text: string;
  materials_text: string;
  year: number | null;
  source_file: string;
  source_sheet: string;
  source_row: number;
}

export interface ImportNotice extends NormalizedNotice {
  program_card_key: string;
  title: string;
  stage: string;
  application_method: string;
  english_requirement_text: string;
  source_channel: string;
}

export interface DepartmentCard {
  key: string;
  department_entity_key: string;
  institution_key: string;
  school_name: string;
  department_name: string;
  current_notice_key: string | null;
  history_notice_keys: string[];
  year: number | null;
  primary_stage: string;
  stage_normalized: StageNormalized;
  requirement_text: string;
  application_method_raw: string;
}

export interface ImportProgramCard extends DepartmentCard {
  department_key: string;
  program_name: string;
  normalized_program_name: string;
  specialty_summary: string;
  degree_type: string;
}

export interface ImportNoticeSource {
  notice_key: string;
  source_url: string;
  source_file: string;
  source_sheet: string;
  source_row: number;
  raw_payload: StagingRow;
}

export interface ImportPlan {
  rawExcelRows: RawExcelRow[];
  normalizedNotices: NormalizedNotice[];
  departmentEntities: DepartmentEntity[];
  departmentCards: DepartmentCard[];
  institutions: ImportInstitution[];
  departments: ImportDepartment[];
  programCards: ImportProgramCard[];
  notices: ImportNotice[];
  noticeSources: ImportNoticeSource[];
  stats: {
    rawExcelRows: number;
    normalizedNotices: number;
    departmentEntities: number;
    departmentCards: number;
    institutions: number;
    departments: number;
    programCards: number;
    notices: number;
    noticeSources: number;
  };
}

const STAGE_PRIORITY: Record<StageNormalized, number> = {
  pre_admission: 5,
  summer_camp: 4,
  winter_camp: 3,
  other: 2,
  unknown: 1,
};

export function buildImportPlan(rows: StagingRow[]): ImportPlan {
  const rawExcelRows: RawExcelRow[] = rows.map((row) => ({
    key: buildRawRowKey(row),
    source_file: row.source_file,
    source_sheet: row.source_sheet,
    source_row: row.source_row,
    raw_payload: row,
  }));

  const institutions = new Map<string, ImportInstitution>();
  const departmentEntities = new Map<string, DepartmentEntity>();
  const notices = new Map<string, ImportNotice>();
  const noticeSources: ImportNoticeSource[] = [];

  for (const row of rows) {
    const schoolName = row.school_name.trim();
    const departmentName = row.department_name.trim() || '全校通知';
    const schoolKey = normalizeIdentityValue(schoolName);
    const departmentKey = buildDepartmentKey(schoolName, departmentName);
    const rawRowKey = buildRawRowKey(row);

    if (!institutions.has(schoolKey)) {
      institutions.set(schoolKey, {
        key: schoolKey,
        name: schoolName,
        normalized_name: schoolKey,
      });
    }

    if (!departmentEntities.has(departmentKey)) {
      departmentEntities.set(departmentKey, {
        key: departmentKey,
        institution_key: schoolKey,
        school_name: schoolName,
        school_name_normalized: schoolKey,
        department_name: departmentName,
        department_name_normalized: normalizeIdentityValue(departmentName),
      });
    }

    const notice = buildNotice(row, rawRowKey, departmentKey, schoolKey);
    if (!notices.has(notice.key)) {
      notices.set(notice.key, notice);
    }

    noticeSources.push({
      notice_key: notice.key,
      source_url: notice.notice_url,
      source_file: row.source_file,
      source_sheet: row.source_sheet,
      source_row: row.source_row,
      raw_payload: row,
    });
  }

  const normalizedNotices = Array.from(notices.values());
  const departments = Array.from(departmentEntities.values()).map((entity) => ({
    ...entity,
    name: entity.department_name,
    normalized_name: entity.department_name_normalized,
  }));

  const noticesByDepartment = groupBy(normalizedNotices, (notice) => notice.department_entity_key);
  const departmentCards: DepartmentCard[] = Array.from(departmentEntities.values()).map((entity) => {
    const noticesForDepartment = (noticesByDepartment.get(entity.key) ?? []).slice().sort(compareNoticesDesc);
    const visibleNotices = noticesForDepartment.filter((notice) => notice.has_url);
    const currentNotice = visibleNotices[0] ?? null;

    return {
      key: entity.key,
      department_entity_key: entity.key,
      institution_key: entity.institution_key,
      school_name: entity.school_name,
      department_name: entity.department_name,
      current_notice_key: currentNotice?.key ?? null,
      history_notice_keys: noticesForDepartment.map((notice) => notice.key),
      year: currentNotice?.year ?? null,
      primary_stage: currentNotice?.stage_raw ?? '',
      stage_normalized: currentNotice?.stage_normalized ?? 'unknown',
      requirement_text: currentNotice?.requirement_text ?? '',
      application_method_raw: currentNotice?.application_method_raw ?? '',
    };
  });

  const programCards: ImportProgramCard[] = departmentCards.map((card) => ({
    ...card,
    department_key: card.department_entity_key,
    program_name: card.department_name,
    normalized_program_name: normalizeIdentityValue(card.department_name),
    specialty_summary: card.requirement_text,
    degree_type: '',
  }));

  return {
    rawExcelRows,
    normalizedNotices,
    departmentEntities: Array.from(departmentEntities.values()),
    departmentCards,
    institutions: Array.from(institutions.values()),
    departments,
    programCards,
    notices: normalizedNotices,
    noticeSources,
    stats: {
      rawExcelRows: rawExcelRows.length,
      normalizedNotices: normalizedNotices.length,
      departmentEntities: departmentEntities.size,
      departmentCards: departmentCards.length,
      institutions: institutions.size,
      departments: departments.length,
      programCards: programCards.length,
      notices: normalizedNotices.length,
      noticeSources: noticeSources.length,
    },
  };
}

function buildNotice(
  row: StagingRow,
  rawRowKey: string,
  departmentEntityKey: string,
  institutionKey: string,
): ImportNotice {
  const schoolName = row.school_name.trim();
  const departmentName = row.department_name.trim() || '全校通知';
  const noticeUrl = row.notice_url.trim();
  const hasUrl = Boolean(noticeUrl);
  const year = inferYear(row);
  const stageRaw = row.stage.trim();
  const stageNormalized = normalizeStage(stageRaw);
  const noticeKey = hasUrl
    ? `${departmentEntityKey}::${noticeUrl}::${row.source_file}`
    : `${departmentEntityKey}::no-url::${row.source_file}::${row.source_sheet}::${row.source_row}`;

  return {
    key: noticeKey,
    department_entity_key: departmentEntityKey,
    raw_row_key: rawRowKey,
    school_name: schoolName,
    school_name_normalized: institutionKey,
    department_name: departmentName,
    department_name_normalized: normalizeIdentityValue(departmentName),
    notice_url: noticeUrl,
    has_url: hasUrl,
    published_at_raw: row.published_at_raw.trim(),
    stage_raw: stageRaw,
    stage_normalized: stageNormalized,
    application_method_raw: row.application_method.trim(),
    requirement_text: row.requirement_text.trim(),
    application_start_raw: row.application_start_raw.trim(),
    application_end_raw: row.application_end_raw.trim(),
    ranking_requirement_text: row.ranking_requirement_text.trim(),
    materials_text: row.materials_text.trim(),
    year,
    source_file: row.source_file,
    source_sheet: row.source_sheet,
    source_row: row.source_row,
    program_card_key: departmentEntityKey,
    title: buildNoticeTitle(row, schoolName, departmentName),
    stage: stageRaw,
    application_method: row.application_method.trim(),
    english_requirement_text: inferEnglishRequirement(row),
    source_channel: row.source_file.endsWith('.xlsx') ? 'excel-import' : 'manual',
  };
}

function buildNoticeTitle(row: StagingRow, schoolName: string, departmentName: string): string {
  const year = inferYear(row);
  const yearText = year ? `${year}年` : '';
  const stageText = row.stage.trim();
  return [yearText, schoolName, departmentName, stageText].filter(Boolean).join(' ');
}

function buildDepartmentKey(schoolName: string, departmentName: string) {
  return `${normalizeIdentityValue(schoolName)}::${normalizeIdentityValue(departmentName)}`;
}

function buildRawRowKey(row: StagingRow) {
  return `${row.source_file}::${row.source_sheet}::${row.source_row}`;
}

function inferYear(row: StagingRow): number | null {
  const text = [row.published_at_raw, row.application_start_raw, row.application_end_raw, row.source_file].join(' ');
  const match = text.match(/20\d{2}/);
  return match ? Number(match[0]) : null;
}

function inferEnglishRequirement(row: StagingRow): string {
  const text = `${row.requirement_text}\n${row.ranking_requirement_text}\n${row.materials_text}`;
  const markers = ['英语', '六级', '四级', 'IELTS', 'TOEFL', '雅思', '托福', 'GMAT'];
  return markers.some((marker) => text.includes(marker)) ? text : '';
}

function normalizeStage(stageRaw: string): StageNormalized {
  const value = stageRaw.trim().toLowerCase();
  if (!value) return 'unknown';
  if (value.includes('预推') || value.includes('推免') || value.includes('十推')) return 'pre_admission';
  if (value.includes('夏令营') || value.includes('夏令')) return 'summer_camp';
  if (value.includes('冬令营') || value.includes('冬令')) return 'winter_camp';
  if (value.includes('宣讲') || value.includes('比赛') || value.includes('大赛') || value.includes('活动') || value.includes('营')) {
    return 'other';
  }
  return 'unknown';
}

function compareNoticesDesc(left: NormalizedNotice, right: NormalizedNotice) {
  const yearDiff = (right.year ?? 0) - (left.year ?? 0);
  if (yearDiff !== 0) return yearDiff;

  const publishedDiff = normalizeDateScore(right.published_at_raw) - normalizeDateScore(left.published_at_raw);
  if (publishedDiff !== 0) return publishedDiff;

  const stageDiff = STAGE_PRIORITY[right.stage_normalized] - STAGE_PRIORITY[left.stage_normalized];
  if (stageDiff !== 0) return stageDiff;

  const sameFile = left.source_file === right.source_file;
  if (sameFile && left.source_row !== right.source_row) {
    return right.source_row - left.source_row;
  }

  const fileDiff = right.source_file.localeCompare(left.source_file, 'zh-Hans-CN');
  if (fileDiff !== 0) return fileDiff;

  return right.source_row - left.source_row;
}

function normalizeDateScore(value: string) {
  const normalized = value
    .replace(/[年/.]/g, '-')
    .replace(/月/g, '-')
    .replace(/日/g, '')
    .replace(/\s+/g, '');
  const match = normalized.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return 0;

  const [, year, month, day] = match;
  return Number(`${year}${month.padStart(2, '0')}${day.padStart(2, '0')}`);
}

function normalizeIdentityValue(value: string) {
  return value
    .trim()
    .replace(/\s+/g, '')
    .replace(/[()]/g, '（）')
    .replace(/（+/g, '（')
    .replace(/）+/g, '）');
}

function groupBy<T>(items: T[], keySelector: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keySelector(item);
    const group = map.get(key);
    if (group) {
      group.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}
