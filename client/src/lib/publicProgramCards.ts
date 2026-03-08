import { useMemo } from 'react';

import type { University } from '@/types/university';
import type { PublicProgramCard, PublicProgramCardDataset } from '@/types/publicProgramCard';

import type { ProgramCardFilters } from '@/lib/programCards';
import { getInstitutionTags, getPrimaryInstitutionTier } from '@/lib/institutionTags';
import { getProgramCardById, useProgramCards } from '@/lib/programCards';

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
      loading: dataset.loading,
    };
  }, [dataset]);
}

export function mapUniversityToPublicProgramCard(university: University): PublicProgramCard {
  const institutionTags = university.institutionTags ?? getInstitutionTags(university.name, university);

  return {
    id: String(university.sourceCardId ?? university.id),
    stableId: university.id,
    institutionName: university.name,
    programName: university.specialty,
    tier: getPrimaryInstitutionTier(institutionTags, university.tier),
    institutionTags,
    location: university.location,
    is985: university.is985,
    is211: university.is211,
    disciplineGrade: university.disciplineGrade,
    degreeType: university.degreeType,
    year: university.duration ? Number(university.duration) || undefined : undefined,
    noticeType: university.noticeType,
    applicationPeriod: university.applicationPeriod,
    deadline: university.deadline,
    url: university.url,
    examForm: university.examForm,
    englishRequirement: university.englishRequirement,
    dataStatus: university.dataStatus,
    dataVerified: university.dataVerified,
    noticeScope: university.noticeScope,
    websiteStatus: university.websiteStatus,
  };
}

export function mapPublicProgramCardToUniversity(card: PublicProgramCard): University {
  return {
    id: card.stableId,
    sourceCardId: card.id,
    name: card.institutionName,
    tier: card.tier,
    institutionTags: card.institutionTags,
    location: card.location,
    is985: card.is985,
    is211: card.is211,
    disciplineGrade: card.disciplineGrade,
    specialty: card.programName,
    degreeType: card.degreeType,
    duration: card.year ? `${card.year}` : undefined,
    examForm: card.examForm,
    englishRequirement: card.englishRequirement,
    applicationPeriod: card.applicationPeriod,
    deadline: card.deadline,
    url: card.url,
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
