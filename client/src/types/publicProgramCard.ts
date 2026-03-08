import type { DataStatus, NoticeType, NoticeScope, WebsiteStatus } from '@/types/university';

export interface PublicProgramCard {
  id: string;
  stableId: number;
  institutionName: string;
  departmentName?: string;
  programName: string;
  specialtySummary?: string;
  tier: string;
  location?: string;
  is985?: boolean;
  is211?: boolean;
  disciplineGrade?: string;
  degreeType: string;
  year?: number;
  noticeType?: NoticeType;
  applicationPeriod: string;
  deadline: string;
  url: string;
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
}
