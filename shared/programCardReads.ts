import type {
  ImportDepartment,
  ImportInstitution,
  ImportNotice,
  ImportProgramCard,
} from './stagingImport';

export interface ProgramCardReadRow {
  id: string;
  institution_name: string;
  department_name: string | null;
  program_name: string;
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
      institution_name: institution.name,
      department_name: department?.name ?? null,
      program_name: card.program_name,
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
}) {
  const publishedScore = normalizeDateScore(notice.published_at_raw);
  const applicationEndScore = normalizeDateScore(notice.application_end_raw);
  return publishedScore * 10_000_000 + applicationEndScore;
}

function normalizeDateScore(value: string) {
  const normalized = value.replace(/年|月/g, '-').replace(/日/g, '');
  const match = normalized.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (!match) return 0;

  const [, year, month, day] = match;
  return Number(`${year}${month.padStart(2, '0')}${day.padStart(2, '0')}`);
}
