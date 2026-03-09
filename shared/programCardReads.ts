import type {
  ImportDepartment,
  ImportInstitution,
  ImportNotice,
  ImportProgramCard,
} from './stagingImport';

export interface ProgramCardReadRow {
  id: string;
  stable_id: string;
  institution_name: string;
  department_name: string | null;
  program_name: string;
  notice_type: string | null;
  application_stage: string | null;
  published_at: string | null;
  deadline: string | null;
  availability_status: string | null;
  eligibility_summary: string | null;
  source_url: string | null;
  verification_status: string | null;
  last_verified_at: string | null;
  degree_type: string | null;
  year: number | null;
  primary_stage: string | null;
  specialty_summary: string | null;
  institution_location: string | null;
  institution_is_985: boolean | null;
  institution_is_211: boolean | null;
  institution_discipline_grade: string | null;
  latest_notice_url: string | null;
  latest_notice_title: string | null;
  latest_notice_application_start_raw: string | null;
  latest_notice_application_end_raw: string | null;
  latest_notice_published_at_raw: string | null;
  latest_notice_materials_text: string | null;
  latest_notice_ranking_requirement_text: string | null;
  latest_notice_english_requirement_text: string | null;
  latest_notice_application_method: string | null;
  updated_at: string;
}

export interface InstitutionReadMetadata {
  province: string | null;
  is_985: boolean | null;
  is_211: boolean | null;
  discipline_grade: string | null;
}

export function buildProgramCardReadRows(input: {
  institutions: ImportInstitution[];
  departments: ImportDepartment[];
  programCards: ImportProgramCard[];
  notices: ImportNotice[];
  institutionMetadataById: Map<string, InstitutionReadMetadata>;
  cardIds: Map<string, string>;
  latestNoticeByCardKey: Map<string, string>;
  updatedAt: string;
}): ProgramCardReadRow[] {
  const institutionsByKey = new Map(input.institutions.map((item) => [item.key, item]));
  const departmentsByKey = new Map(input.departments.map((item) => [item.key, item]));
  const noticesByKey = new Map(input.notices.map((item) => [item.key, item]));
  const rows: ProgramCardReadRow[] = [];

  for (const card of input.programCards) {
    const cardId = input.cardIds.get(card.key);
    const institution = institutionsByKey.get(card.institution_key);
    if (!cardId || !institution) {
      continue;
    }

    const department = departmentsByKey.get(card.department_key);
    const latestNoticeKey = input.latestNoticeByCardKey.get(card.key);
    const latestNotice = latestNoticeKey ? noticesByKey.get(latestNoticeKey) : null;
    const institutionMetadata = input.institutionMetadataById.get(cardId);

    rows.push({
      id: cardId,
      stable_id: card.department_key,
      institution_name: institution.name,
      department_name: department?.name ?? null,
      program_name: card.program_name,
      notice_type:
        latestNotice?.stage_normalized ??
        card.stage_normalized ??
        normalizeNoticeType(latestNotice?.stage ?? card.primary_stage ?? null),
      application_stage: card.primary_stage ?? null,
      published_at: latestNotice?.published_at_raw ?? null,
      deadline: latestNotice?.application_end_raw ?? null,
      availability_status: null,
      eligibility_summary: card.specialty_summary ?? null,
      source_url: latestNotice?.notice_url ?? null,
      verification_status: null,
      last_verified_at: null,
      degree_type: card.degree_type ?? null,
      year: card.year ?? null,
      primary_stage: card.primary_stage ?? null,
      specialty_summary: card.specialty_summary ?? null,
      institution_location: institutionMetadata?.province ?? null,
      institution_is_985: institutionMetadata?.is_985 ?? null,
      institution_is_211: institutionMetadata?.is_211 ?? null,
      institution_discipline_grade: institutionMetadata?.discipline_grade ?? null,
      latest_notice_url: latestNotice?.notice_url ?? null,
      latest_notice_title: latestNotice?.title ?? null,
      latest_notice_application_start_raw: latestNotice?.application_start_raw ?? null,
      latest_notice_application_end_raw: latestNotice?.application_end_raw ?? null,
      latest_notice_published_at_raw: latestNotice?.published_at_raw ?? null,
      latest_notice_materials_text: latestNotice?.materials_text ?? null,
      latest_notice_ranking_requirement_text: latestNotice?.ranking_requirement_text ?? null,
      latest_notice_english_requirement_text: latestNotice?.english_requirement_text ?? null,
      latest_notice_application_method: latestNotice?.application_method ?? null,
      updated_at: input.updatedAt,
    });
  }

  return rows;
}

export function buildLatestNoticeByCardKey(
  notices: Array<{
    key: string;
    program_card_key: string;
    published_at_raw: string;
    application_end_raw: string;
    year?: number | null;
    stage_normalized?: 'pre_admission' | 'summer_camp' | 'winter_camp' | 'other' | 'unknown';
    source_file?: string;
    source_row?: number;
  }>,
): Map<string, string> {
  const latestNoticeByCard = new Map<string, string>();
  const rankByNoticeKey = new Map<string, number>();

  for (const notice of notices) {
    rankByNoticeKey.set(notice.key, buildNoticeRank(notice));
  }

  for (const notice of notices) {
    const existingNoticeKey = latestNoticeByCard.get(notice.program_card_key);
    if (!existingNoticeKey) {
      latestNoticeByCard.set(notice.program_card_key, notice.key);
      continue;
    }

    const currentRank = rankByNoticeKey.get(existingNoticeKey) ?? Number.MIN_SAFE_INTEGER;
    const nextRank = rankByNoticeKey.get(notice.key) ?? Number.MIN_SAFE_INTEGER;
    if (nextRank >= currentRank) {
      latestNoticeByCard.set(notice.program_card_key, notice.key);
    }
  }

  return latestNoticeByCard;
}

function buildNoticeRank(notice: {
  published_at_raw: string;
  application_end_raw: string;
  year?: number | null;
  stage_normalized?: 'pre_admission' | 'summer_camp' | 'winter_camp' | 'other' | 'unknown';
  source_file?: string;
  source_row?: number;
}) {
  const yearScore = notice.year ?? 0;
  const publishedScore = normalizeDateScore(notice.published_at_raw);
  const applicationEndScore = normalizeDateScore(notice.application_end_raw);
  const stageScore = normalizeStagePriority(notice.stage_normalized);
  const rowScore = notice.source_row ?? 0;
  const fileScore = notice.source_file ? hashText(notice.source_file) : 0;

  return (
    yearScore * 10_000_000_000_000 +
    publishedScore * 100_000 +
    stageScore * 10_000 +
    applicationEndScore * 10 +
    Math.min(rowScore, 9) +
    fileScore / 10_000_000
  );
}

function normalizeDateScore(value: string) {
  const normalized = value.replace(/年|月/g, '-').replace(/日/g, '');
  const match = normalized.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (!match) return 0;

  const [, year, month, day] = match;
  return Number(`${year}${month.padStart(2, '0')}${day.padStart(2, '0')}`);
}

function normalizeStagePriority(
  stage: 'pre_admission' | 'summer_camp' | 'winter_camp' | 'other' | 'unknown' | undefined,
) {
  switch (stage) {
    case 'pre_admission':
      return 5;
    case 'summer_camp':
      return 4;
    case 'winter_camp':
      return 3;
    case 'other':
      return 2;
    case 'unknown':
      return 1;
    default:
      return 0;
  }
}

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 10_000_000;
  }
  return hash;
}

function normalizeNoticeType(stage: string | null) {
  if (!stage) return null;
  const value = stage.toLowerCase();
  if (value.includes('预推') || value.includes('推免')) return 'pre_admission';
  if (value.includes('summer') || value.includes('夏令')) return 'summer_camp';
  if (value.includes('winter') || value.includes('冬令')) return 'winter_camp';
  return 'unknown';
}
