import { useMemo } from 'react';

import type { University } from '@/types/university';
import type {
  AvailabilityStatus,
  PublicProgramCard,
  PublicProgramCardDataset,
  VerificationStatus,
} from '@/types/publicProgramCard';

import type { ProgramCardFilters } from '@/lib/programCards';
import { getInstitutionTags, getPrimaryInstitutionTier } from '@/lib/institutionTags';
import { getProgramCardById, getProgramCards, useProgramCards } from '@/lib/programCards';

export { ProgramCardFilters };

export function usePublicProgramCards(filters: ProgramCardFilters = {}) {
  const dataset = useProgramCards(filters);

  return useMemo<PublicProgramCardDataset & { loading: boolean }>(() => {
    const cards = dataset.universities.map(mapUniversityToPublicProgramCard);

    return {
      cards,
      coverageStats: dataset.coverageStats,
      lastUpdated: dataset.lastUpdated,
      source: dataset.source,
      configured: dataset.configured,
      error: dataset.error,
      supabaseHost: dataset.supabaseHost,
      hasMore: dataset.hasMore,
      totalCount: dataset.totalCount,
      institutionCount: dataset.institutionCount,
      loading: dataset.loading,
    };
  }, [dataset]);
}

export async function getPublicProgramCards(filters: ProgramCardFilters = {}) {
  const dataset = await getProgramCards(filters);
  return dataset.universities.map(mapUniversityToPublicProgramCard);
}

export function mapUniversityToPublicProgramCard(university: University): PublicProgramCard {
  const institutionTags = university.institutionTags ?? getInstitutionTags(university.name, university);
  const stableId = String(university.sourceCardId ?? university.id);
  const legacyId = university.id;
  const sourceUrl = university.url ?? '';
  const verificationStatus = deriveVerificationStatus(university.dataVerified, university.dataStatus);
  const availabilityStatus = deriveAvailabilityStatus(university.dataStatus, sourceUrl);

  return {
    id: stableId,
    stableId,
    legacyId,
    sourceCardId: university.sourceCardId ? String(university.sourceCardId) : undefined,
    institutionName: university.name,
    programName: university.specialty,
    specialtySummary: university.specialtySummary,
    eligibilitySummary: university.specialtySummary ?? university.specialty,
    tier: getPrimaryInstitutionTier(institutionTags, university.tier),
    institutionTags,
    location: university.location,
    is985: university.is985,
    is211: university.is211,
    disciplineGrade: university.disciplineGrade,
    degreeType: university.degreeType,
    year: university.duration ? Number(university.duration) || undefined : undefined,
    noticeType: university.noticeType,
    applicationStage: university.noticeType ?? null,
    publishedAt: null,
    applicationPeriod: university.applicationPeriod,
    deadline: university.deadline,
    sourceUrl,
    url: sourceUrl,
    availabilityStatus,
    verificationStatus,
    lastVerifiedAt: university.dataVerified ? null : null,
    updatedAt: null,
    examForm: university.examForm,
    englishRequirement: university.englishRequirement,
    dataStatus: university.dataStatus,
    dataVerified: university.dataVerified,
    noticeScope: university.noticeScope,
    websiteStatus: university.websiteStatus,
  };
}

export function mapPublicProgramCardToUniversity(card: PublicProgramCard): University {
  const id = card.legacyId ?? normalizeLegacyId(card.stableId);
  return {
    id,
    sourceCardId: card.sourceCardId ?? card.id,
    name: card.institutionName,
    tier: card.tier,
    institutionTags: card.institutionTags,
    location: card.location,
    is985: card.is985,
    is211: card.is211,
    disciplineGrade: card.disciplineGrade,
    specialty: card.programName,
    specialtySummary: card.specialtySummary ?? card.eligibilitySummary ?? undefined,
    degreeType: card.degreeType,
    duration: card.year ? `${card.year}` : undefined,
    examForm: card.examForm,
    englishRequirement: card.englishRequirement,
    applicationPeriod: card.applicationPeriod,
    deadline: card.deadline,
    url: card.sourceUrl || card.url || '',
    dataStatus: card.dataStatus,
    dataVerified: card.dataVerified,
    noticeType: card.noticeType,
    noticeScope: card.noticeScope,
    websiteStatus: card.websiteStatus,
    sourceChannel: 'supabase',
  };
}

export async function getPublicProgramCardById(id: string | number): Promise<PublicProgramCard | null> {
  const university = await getProgramCardById(id);
  return university ? mapUniversityToPublicProgramCard(university) : null;
}

function normalizeLegacyId(stableId: string): number {
  const numeric = Number(stableId);
  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.trunc(numeric);
  }

  let hash = 0;
  for (let index = 0; index < stableId.length; index += 1) {
    hash = (hash * 31 + stableId.charCodeAt(index)) % 1_000_000_000;
  }

  return hash > 0 ? hash : 1;
}

function deriveVerificationStatus(
  dataVerified: boolean | undefined,
  dataStatus: University['dataStatus'],
): VerificationStatus {
  if (dataVerified) return 'verified';
  if (dataStatus === 'PENDING_MANUAL') return 'needs_review';
  if (dataStatus === 'PARTIAL') return 'needs_review';
  return 'unknown';
}

function deriveAvailabilityStatus(
  dataStatus: University['dataStatus'],
  sourceUrl: string,
): AvailabilityStatus {
  if (!sourceUrl) return 'unknown';
  if (dataStatus === 'COMPLETE') return 'current';
  if (dataStatus === 'PARTIAL') return 'needs_review';
  if (dataStatus === 'PENDING_MANUAL') return 'needs_review';
  return 'unknown';
}
