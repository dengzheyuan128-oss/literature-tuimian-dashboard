import type { ExtractedNotice } from '@/lib/glmApi';
import type { University } from '@/types/university';

export interface SubmissionExtractedPayload {
  institutionName: string;
  programName: string;
  degreeType: string;
  applicationPeriod: string;
  deadline: string;
  examForm: string;
  englishRequirement: string;
  noticeType: string;
}

export interface SubmissionNoticeInsert {
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
  source_type: string;
  review_status: 'approved';
}

const UNKNOWN_MARKERS = new Set(['', '未注明', '待确认', '待补充']);

export function buildSubmissionExtractedPayload(
  extracted: ExtractedNotice,
): SubmissionExtractedPayload {
  return {
    institutionName: normalizeField(extracted.name),
    programName: normalizeField(extracted.specialty),
    degreeType: normalizeField(extracted.degreeType),
    applicationPeriod: normalizeField(extracted.applicationPeriod),
    deadline: normalizeField(extracted.deadline),
    examForm: normalizeField(extracted.examForm),
    englishRequirement: normalizeField(extracted.englishRequirement),
    noticeType: normalizeField(extracted.noticeType),
  };
}

export function findBestProgramCardMatch(
  payload: SubmissionExtractedPayload,
  universities: University[],
): University | null {
  const candidates = universities
    .map((university) => ({
      university,
      score: scoreProgramCardMatch(payload, university),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  return candidates[0]?.university ?? null;
}

export function buildApprovedNoticeInsert(
  payload: SubmissionExtractedPayload,
  submittedUrl: string,
): SubmissionNoticeInsert {
  return {
    title: buildSubmissionTitle(payload),
    notice_url: submittedUrl.trim(),
    published_at_raw: '',
    stage: inferStage(payload.noticeType),
    application_start_raw: payload.applicationPeriod,
    application_end_raw: payload.deadline,
    requirement_text: '',
    ranking_requirement_text: '',
    english_requirement_text: payload.englishRequirement,
    materials_text: '',
    application_method: payload.examForm,
    source_channel: 'user-submission',
    source_type: 'community',
    review_status: 'approved',
  };
}

export function buildSubmissionTitle(payload: SubmissionExtractedPayload): string {
  return [
    payload.institutionName,
    payload.programName,
    payload.noticeType,
  ]
    .map((part) => part.trim())
    .filter((part) => !UNKNOWN_MARKERS.has(part))
    .join(' ')
    .trim() || '未命名公告';
}

function scoreProgramCardMatch(payload: SubmissionExtractedPayload, university: University): number {
  let score = 0;

  const institutionName = payload.institutionName.toLowerCase();
  const programName = payload.programName.toLowerCase();
  const universityName = university.name.toLowerCase();
  const specialty = university.specialty.toLowerCase();

  if (!UNKNOWN_MARKERS.has(payload.institutionName)) {
    if (universityName === institutionName) score += 8;
    else if (universityName.includes(institutionName) || institutionName.includes(universityName)) score += 5;
  }

  if (!UNKNOWN_MARKERS.has(payload.programName)) {
    if (specialty === programName) score += 6;
    else if (specialty.includes(programName) || programName.includes(specialty)) score += 4;
  }

  if (!UNKNOWN_MARKERS.has(payload.noticeType) && university.noticeType === payload.noticeType) {
    score += 2;
  }

  if (!UNKNOWN_MARKERS.has(payload.degreeType) && university.degreeType === payload.degreeType) {
    score += 1;
  }

  return score;
}

function inferStage(noticeType: string): string {
  if (noticeType.includes('夏令营')) return '夏令营';
  if (noticeType.includes('预推免')) return '预推免';
  if (noticeType.includes('冬令营')) return '冬令营';
  return noticeType;
}

function normalizeField(value: string | null | undefined): string {
  return value?.trim() || '未注明';
}
