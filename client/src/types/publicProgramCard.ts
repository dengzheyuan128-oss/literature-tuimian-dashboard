import type { DataStatus, NoticeType, NoticeScope, WebsiteStatus } from '@/types/university';
import type { SimplifiedTier } from '@/lib/tierUtils';

export type AvailabilityStatus = 'current' | 'needs_review' | 'expired' | 'unknown';
export type VerificationStatus = 'verified' | 'needs_review' | 'unknown';

export interface PublicProgramCard {
  id: string;
  stableId: string;
  legacyId: number;
  sourceCardId?: string;
  institutionName: string;
  departmentName?: string;
  programName: string;
  specialtySummary?: string;
  eligibilitySummary?: string | null;
  tier: string;
  institutionTags: SimplifiedTier[];
  location?: string;
  is985?: boolean;
  is211?: boolean;
  disciplineGrade?: string;
  degreeType: string;
  year?: number;
  noticeType?: NoticeType;
  applicationStage?: string | null;
  publishedAt?: string | null;
  applicationPeriod: string;
  deadline: string;
  sourceUrl: string;
  url?: string;
  availabilityStatus: AvailabilityStatus;
  verificationStatus: VerificationStatus;
  lastVerifiedAt?: string | null;
  updatedAt?: string | null;
  examForm: string;
  englishRequirement: string;
  dataStatus: DataStatus;
  dataVerified: boolean;
  noticeScope?: NoticeScope;
  websiteStatus?: WebsiteStatus;
}

export interface PublicProgramCardDataset {
  cards: PublicProgramCard[];
  coverageStats: {
    total: number;
    complete: number;
    partial: number;
    pendingManual: number;
    completeRate: number;
  };
  lastUpdated: string;
  source: 'api' | 'supabase' | 'archived-json' | 'supabase-loading' | 'supabase-error';
  configured: boolean;
  error: string | null;
  supabaseHost: string | null;
  hasMore: boolean;
  totalCount?: number;
  institutionCount?: number;
}
