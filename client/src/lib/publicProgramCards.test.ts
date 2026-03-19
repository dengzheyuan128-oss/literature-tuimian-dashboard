import { describe, expect, it } from 'vitest';

import type { University } from '@/types/university';
import {
  mapPublicProgramCardToUniversity,
  mapUniversityToPublicProgramCard,
} from '@/lib/publicProgramCards';

describe('publicProgramCards', () => {
  it('maps the legacy university-shaped card into the V1 public read model', () => {
    const input = {
      id: 42,
      sourceCardId: 'card-42',
      name: 'PKU',
      specialty: 'Chinese History',
      specialtySummary: 'Related majors accepted',
      tier: '985',
      institutionTags: ['985', '211', '双一流'],
      location: 'Beijing',
      is985: true,
      is211: true,
      disciplineGrade: 'A+',
      degreeType: 'Academic',
      duration: '2',
      examForm: 'Interview',
      englishRequirement: 'CET6',
      applicationPeriod: '2026-06-01 - 2026-06-10',
      deadline: '2026-06-10',
      url: 'https://example.com/pku',
      dataStatus: 'COMPLETE',
      dataVerified: true,
      noticeType: 'Summer Camp',
      noticeScope: 'general',
      websiteStatus: 'available',
    } as const satisfies University;

    const result = mapUniversityToPublicProgramCard(input);

    expect(result).toMatchObject({
      id: 'card-42',
      stableId: 'card-42',
      legacyId: 42,
      sourceCardId: 'card-42',
      institutionName: 'PKU',
      programName: 'Chinese History',
      eligibilitySummary: 'Related majors accepted',
      sourceUrl: 'https://example.com/pku',
      availabilityStatus: 'current',
      verificationStatus: 'verified',
      deadline: '2026-06-10',
    });
  });

  it('preserves compatibility when converting back to the university shape', () => {
    const input = {
      id: 'card-99',
      legacyId: 99,
      stableId: 'card-99',
      institutionName: 'Fudan',
      programName: 'Chinese Literature',
      tier: '985',
      institutionTags: ['985', '211', '双一流'],
      degreeType: 'Academic',
      applicationPeriod: '2026-06-01 - 2026-06-10',
      deadline: '2026-06-10',
      sourceUrl: 'https://example.com/fudan',
      url: 'https://example.com/fudan',
      availabilityStatus: 'current',
      verificationStatus: 'verified',
      examForm: 'Interview',
      englishRequirement: 'CET6',
      dataStatus: 'COMPLETE',
      dataVerified: true,
    } as const satisfies Partial<ReturnType<typeof mapUniversityToPublicProgramCard>>;

    const result = mapPublicProgramCardToUniversity(input as any);

    expect(result).toMatchObject({
      id: 99,
      sourceCardId: 'card-99',
      name: 'Fudan',
      specialty: 'Chinese Literature',
      url: 'https://example.com/fudan',
    });
  });
});
