export interface UserProfile {
  undergraduateUniversity: string;
  undergraduateMajor: string;
  gpa: number;
  ranking: number;
  rankingPercentile: number;

  paperCount: number;
  paperLevel: "核心期刊" | "普通期刊" | "会议论文" | "其他" | "";
  projectCount: number;
  projectLevel: "国家级" | "省级" | "校级" | "其他" | "";
  projectRole: "主持人" | "核心成员" | "参与者" | "";

  competitionCount: number;
  competitionLevel: "国家级" | "省级" | "校级" | "其他" | "";

  researchInterests: string[];
  researchDescription: string;

  hasStudentLeadership: boolean;
  studentLeadershipPosition: string;
  hasNationalCompetition: boolean;
  hasProvinceCompetition: boolean;
  hasSchoolCompetition: boolean;
  practiceExperience: string;

  hasCET4: boolean;
  cet4Score: number;
  hasCET6: boolean;
  cet6Score: number;
  hasIELTS: boolean;
  ieltsScore: number;
  hasTOEFL: boolean;
  toeflScore: number;

  hasRecommendationQualification: boolean;
  targetCities: string[];
  degreePreference: "学硕" | "专硕" | "都可以";
  remarks: string;

  createdAt: number;
  updatedAt: number;
}

export interface MatchResult {
  universityId: number;
  universityName: string;
  tier: string;
  matchScore: number;
  category: "冲" | "稳" | "保";
  reasons: string[];
}

export interface MatchReport {
  userProfile: UserProfile;
  overallScore: number;
  scoreBreakdown: {
    undergraduateLevel: number;
    gpaAndRanking: number;
    englishLevel: number;
    researchAndCompetition: number;
    practiceExperience: number;
  };
  results: {
    rush: MatchResult[];
    stable: MatchResult[];
    conservative: MatchResult[];
  };
  createdAt: number;
}
