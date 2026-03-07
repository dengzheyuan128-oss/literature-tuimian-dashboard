import type { StagingRow } from './excelImport';

export interface ImportInstitution {
  key: string;
  name: string;
  normalized_name: string;
}

export interface ImportDepartment {
  key: string;
  institution_key: string;
  name: string;
  normalized_name: string;
}

export interface ImportProgramCard {
  key: string;
  institution_key: string;
  department_key: string;
  program_name: string;
  normalized_program_name: string;
  specialty_summary: string;
  degree_type: string;
  year: number | null;
  primary_stage: string;
}

export interface ImportNotice {
  key: string;
  program_card_key: string;
  title: string;
  notice_url: string;
  published_at_raw: string;
  stage: string;
  application_start_raw: string;
  application_end_raw: string;
  requirement_text: string;
  ranking_requirement_text: string;
  english_requirement_text: string;
  materials_text: string;
  application_method: string;
  source_channel: string;
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
  institutions: ImportInstitution[];
  departments: ImportDepartment[];
  programCards: ImportProgramCard[];
  notices: ImportNotice[];
  noticeSources: ImportNoticeSource[];
  stats: {
    institutions: number;
    departments: number;
    programCards: number;
    notices: number;
    noticeSources: number;
  };
}

export function buildImportPlan(rows: StagingRow[]): ImportPlan {
  const institutions = new Map<string, ImportInstitution>();
  const departments = new Map<string, ImportDepartment>();
  const programCards = new Map<string, ImportProgramCard>();
  const notices = new Map<string, ImportNotice>();
  const noticeSources: ImportNoticeSource[] = [];

  rows.forEach((row) => {
    const institutionName = row.school_name.trim();
    const departmentName = row.department_name.trim() || '未分学院';
    const programName = inferProgramName(row);
    const stage = row.stage.trim();
    const year = inferYear(row);

    const institutionKey = normalizeKey(institutionName);
    if (!institutions.has(institutionKey)) {
      institutions.set(institutionKey, {
        key: institutionKey,
        name: institutionName,
        normalized_name: institutionKey,
      });
    }

    const departmentKey = `${institutionKey}::${normalizeKey(departmentName)}`;
    if (!departments.has(departmentKey)) {
      departments.set(departmentKey, {
        key: departmentKey,
        institution_key: institutionKey,
        name: departmentName,
        normalized_name: normalizeKey(departmentName),
      });
    }

    const cardKey = [
      institutionKey,
      normalizeKey(departmentName),
      normalizeKey(programName),
      year ?? 'unknown',
      normalizeKey(stage),
    ].join('::');

    if (!programCards.has(cardKey)) {
      programCards.set(cardKey, {
        key: cardKey,
        institution_key: institutionKey,
        department_key: departmentKey,
        program_name: programName,
        normalized_program_name: normalizeKey(programName),
        specialty_summary: row.requirement_text.trim(),
        degree_type: inferDegreeType(row),
        year,
        primary_stage: stage,
      });
    }

    const noticeKey = `${cardKey}::${normalizeKey(row.notice_url)}`;
    if (!notices.has(noticeKey)) {
      notices.set(noticeKey, {
        key: noticeKey,
        program_card_key: cardKey,
        title: buildNoticeTitle(row, institutionName, departmentName, programName),
        notice_url: row.notice_url.trim(),
        published_at_raw: row.published_at_raw.trim(),
        stage,
        application_start_raw: row.application_start_raw.trim(),
        application_end_raw: row.application_end_raw.trim(),
        requirement_text: row.requirement_text.trim(),
        ranking_requirement_text: row.ranking_requirement_text.trim(),
        english_requirement_text: inferEnglishRequirement(row),
        materials_text: row.materials_text.trim(),
        application_method: row.application_method.trim(),
        source_channel: row.source_file.endsWith('.xlsx') ? 'excel-import' : 'manual',
      });
    }

    noticeSources.push({
      notice_key: noticeKey,
      source_url: row.notice_url.trim(),
      source_file: row.source_file,
      source_sheet: row.source_sheet,
      source_row: row.source_row,
      raw_payload: row,
    });
  });

  return {
    institutions: Array.from(institutions.values()),
    departments: Array.from(departments.values()),
    programCards: Array.from(programCards.values()),
    notices: Array.from(notices.values()),
    noticeSources,
    stats: {
      institutions: institutions.size,
      departments: departments.size,
      programCards: programCards.size,
      notices: notices.size,
      noticeSources: noticeSources.length,
    },
  };
}

function inferProgramName(row: StagingRow): string {
  const fromProgram = row.program_name_raw.trim();
  if (fromProgram) return fromProgram;

  if (row.department_name.trim()) return row.department_name.trim();
  return '未命名项目';
}

function inferYear(row: StagingRow): number | null {
  const text = `${row.published_at_raw} ${row.application_start_raw} ${row.application_end_raw}`;
  const match = text.match(/20\d{2}/);
  return match ? Number(match[0]) : null;
}

function inferDegreeType(row: StagingRow): string {
  const text = `${row.program_name_raw} ${row.requirement_text} ${row.materials_text}`;
  if (text.includes('博士')) return '博士';
  if (text.includes('专业学位') || text.includes('专硕')) return '专硕';
  if (text.includes('学术学位') || text.includes('学硕')) return '学硕';
  return '';
}

function inferEnglishRequirement(row: StagingRow): string {
  const text = `${row.requirement_text}\n${row.ranking_requirement_text}\n${row.materials_text}`;
  const markers = ['英语', '六级', '四级', 'IELTS', 'TOEFL', '雅思', '托福', 'GMAT'];
  return markers.some((marker) => text.includes(marker)) ? text : '';
}

function buildNoticeTitle(
  row: StagingRow,
  institutionName: string,
  departmentName: string,
  programName: string,
): string {
  const year = inferYear(row);
  const yearText = year ? `${year}年` : '';
  const stageText = row.stage.trim();
  return [yearText, institutionName, departmentName, programName, stageText].filter(Boolean).join(' ');
}

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[（）()]/g, '')
    .replace(/[、,，;；:：]/g, '-');
}
