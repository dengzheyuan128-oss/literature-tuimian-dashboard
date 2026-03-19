import type { MatchReport, MatchResult, UserProfile } from "@/types/userProfile";
import { getPublicProgramCards } from "@/lib/publicProgramCards";
import type { PublicProgramCard } from "@/types/publicProgramCard";

interface ScoreBreakdown {
  undergraduateLevel: number;
  gpaAndRanking: number;
  englishLevel: number;
  researchAndCompetition: number;
  practiceExperience: number;
}

interface TargetThreshold {
  minGPA: number;
  maxRankingPercentile: number;
  minEnglishScore: number;
  prestigeWeight: number;
  label: string;
}

const TOP_UNDERGRADUATE_SCHOOLS = new Set([
  "北京大学",
  "清华大学",
  "复旦大学",
  "上海交通大学",
  "浙江大学",
  "南京大学",
  "武汉大学",
  "中山大学",
  "四川大学",
  "华中科技大学",
  "北京师范大学",
]);

const STRONG_UNDERGRADUATE_SCHOOLS = new Set([
  "华东师范大学",
  "南京师范大学",
  "湖南师范大学",
  "华中师范大学",
  "华南师范大学",
  "山东大学",
  "南开大学",
  "同济大学",
  "中国人民大学",
  "兰州大学",
]);

const TARGET_THRESHOLDS: Record<string, TargetThreshold> = {
  "985": {
    minGPA: 3.5,
    maxRankingPercentile: 15,
    minEnglishScore: 24,
    prestigeWeight: 1.06,
    label: "顶尖项目",
  },
  "211": {
    minGPA: 3.3,
    maxRankingPercentile: 25,
    minEnglishScore: 20,
    prestigeWeight: 1.02,
    label: "强势项目",
  },
  "双一流": {
    minGPA: 3.2,
    maxRankingPercentile: 30,
    minEnglishScore: 18,
    prestigeWeight: 1,
    label: "重点项目",
  },
  "省属重点师范": {
    minGPA: 3.0,
    maxRankingPercentile: 40,
    minEnglishScore: 16,
    prestigeWeight: 0.97,
    label: "稳健项目",
  },
  default: {
    minGPA: 2.8,
    maxRankingPercentile: 50,
    minEnglishScore: 14,
    prestigeWeight: 0.94,
    label: "保底项目",
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function resolveTargetThreshold(card: PublicProgramCard): TargetThreshold {
  return TARGET_THRESHOLDS[card.tier] ?? TARGET_THRESHOLDS.default;
}

function hasStrongResearch(profile: UserProfile) {
  return profile.paperCount > 0 || profile.projectCount > 0 || profile.competitionCount > 0;
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

function buildMatchResult(
  card: PublicProgramCard,
  matchScore: number,
  category: MatchResult["category"],
  reasons: string[],
): MatchResult {
  return {
    universityId: card.legacyId ?? normalizeLegacyId(card.stableId),
    universityName: card.institutionName,
    tier: card.tier,
    matchScore,
    category,
    reasons,
  };
}

export const matchingAlgorithm = {
  calculateUndergraduateTierScore: (university: string): number => {
    if (TOP_UNDERGRADUATE_SCHOOLS.has(university)) return 100;
    if (STRONG_UNDERGRADUATE_SCHOOLS.has(university)) return 88;
    if (university.includes("大学") || university.includes("师范")) return 78;
    return 70;
  },

  calculateGPAAndRankingScore: (gpa: number, rankingPercentile: number): number => {
    let score = 0;

    if (gpa >= 3.8) score += 40;
    else if (gpa >= 3.6) score += 38;
    else if (gpa >= 3.4) score += 36;
    else if (gpa >= 3.2) score += 34;
    else if (gpa >= 3.0) score += 32;
    else if (gpa >= 2.8) score += 28;
    else if (gpa >= 2.6) score += 24;
    else if (gpa >= 2.4) score += 20;
    else score += 15;

    if (rankingPercentile <= 10) score += 35;
    else if (rankingPercentile <= 20) score += 33;
    else if (rankingPercentile <= 30) score += 31;
    else if (rankingPercentile <= 40) score += 29;
    else if (rankingPercentile <= 50) score += 27;
    else if (rankingPercentile <= 60) score += 25;
    else if (rankingPercentile <= 70) score += 20;
    else if (rankingPercentile <= 80) score += 15;
    else score += 10;

    return Math.min(score, 75);
  },

  calculateEnglishScore: (hasCET6: boolean, cet6Score: number, hasIELTS: boolean, ieltsScore: number): number => {
    let score = 0;

    if (hasCET6) {
      if (cet6Score >= 550) score = 30;
      else if (cet6Score >= 500) score = 28;
      else if (cet6Score >= 450) score = 25;
      else if (cet6Score >= 400) score = 20;
      else score = 15;
    }

    if (hasIELTS) {
      if (ieltsScore >= 7.0) score = Math.max(score, 30);
      else if (ieltsScore >= 6.5) score = Math.max(score, 28);
      else if (ieltsScore >= 6.0) score = Math.max(score, 25);
      else if (ieltsScore >= 5.5) score = Math.max(score, 20);
      else score = Math.max(score, 15);
    }

    return score;
  },

  calculateResearchAndCompetitionScore: (
    paperCount: number,
    paperLevel: string,
    projectCount: number,
    projectLevel: string,
    competitionCount: number,
    competitionLevel: string,
  ): number => {
    let score = 0;

    if (paperCount > 0) {
      const paperWeight = paperLevel === "核心期刊" ? 3 : paperLevel === "普通期刊" ? 2 : paperLevel === "会议论文" ? 1.5 : 1;
      score += Math.min(paperCount * paperWeight, 20);
    }

    if (projectCount > 0) {
      const projectWeight = projectLevel === "国家级" ? 4 : projectLevel === "省级" ? 2.5 : projectLevel === "校级" ? 1.5 : 1;
      score += Math.min(projectCount * projectWeight, 20);
    }

    if (competitionCount > 0) {
      const competitionWeight =
        competitionLevel === "国家级" ? 3 : competitionLevel === "省级" ? 2 : competitionLevel === "校级" ? 1 : 0.5;
      score += Math.min(competitionCount * competitionWeight, 15);
    }

    return Math.min(score, 55);
  },

  calculatePracticeScore: (
    hasStudentLeadership: boolean,
    hasNationalCompetition: boolean,
    hasProvinceCompetition: boolean,
    hasSchoolCompetition: boolean,
  ): number => {
    let score = 0;
    if (hasStudentLeadership) score += 5;
    if (hasNationalCompetition) score += 10;
    if (hasProvinceCompetition) score += 5;
    if (hasSchoolCompetition) score += 3;
    return Math.min(score, 20);
  },

  calculateScores: (profile: UserProfile): ScoreBreakdown => {
    const undergraduateLevel = matchingAlgorithm.calculateUndergraduateTierScore(profile.undergraduateUniversity);
    const gpaAndRanking = matchingAlgorithm.calculateGPAAndRankingScore(profile.gpa, profile.rankingPercentile);
    const englishLevel = matchingAlgorithm.calculateEnglishScore(
      profile.hasCET6,
      profile.cet6Score,
      profile.hasIELTS,
      profile.ieltsScore,
    );
    const researchAndCompetition = matchingAlgorithm.calculateResearchAndCompetitionScore(
      profile.paperCount,
      profile.paperLevel,
      profile.projectCount,
      profile.projectLevel,
      profile.competitionCount,
      profile.competitionLevel,
    );
    const practiceExperience = matchingAlgorithm.calculatePracticeScore(
      profile.hasStudentLeadership,
      profile.hasNationalCompetition,
      profile.hasProvinceCompetition,
      profile.hasSchoolCompetition,
    );

    return {
      undergraduateLevel,
      gpaAndRanking,
      englishLevel,
      researchAndCompetition,
      practiceExperience,
    };
  },

  calculateOverallScore: (breakdown: ScoreBreakdown): number => {
    const overallScore =
      (breakdown.undergraduateLevel / 100) * 25 +
      (breakdown.gpaAndRanking / 75) * 30 +
      (breakdown.englishLevel / 30) * 20 +
      (breakdown.researchAndCompetition / 55) * 15 +
      (breakdown.practiceExperience / 20) * 10;

    return Math.round(clamp(overallScore, 0, 100));
  },

  calculateProgramMatchScore: (profile: UserProfile, card: PublicProgramCard): number => {
    const breakdown = matchingAlgorithm.calculateScores(profile);
    const baseScore = matchingAlgorithm.calculateOverallScore(breakdown);
    const threshold = resolveTargetThreshold(card);

    let adjustedScore = baseScore * threshold.prestigeWeight;

    if (profile.gpa < threshold.minGPA) {
      adjustedScore -= (threshold.minGPA - profile.gpa) * 10;
    }

    if (profile.rankingPercentile > threshold.maxRankingPercentile) {
      adjustedScore -= (profile.rankingPercentile - threshold.maxRankingPercentile) * 0.7;
    }

    if (breakdown.englishLevel < threshold.minEnglishScore) {
      adjustedScore -= (threshold.minEnglishScore - breakdown.englishLevel) * 1.2;
    }

    if (card.verificationStatus === "needs_review") {
      adjustedScore -= 4;
    }

    if (card.availabilityStatus === "expired") {
      adjustedScore -= 15;
    }

    if (card.noticeScope === "general") {
      adjustedScore -= 3;
    }

    return Math.round(clamp(adjustedScore, 0, 100));
  },

  generateMatchReport: async (profile: UserProfile): Promise<MatchReport> => {
    const breakdown = matchingAlgorithm.calculateScores(profile);
    const overallScore = matchingAlgorithm.calculateOverallScore(breakdown);
    const cards = await getPublicProgramCards();

    const matchScores = cards
      .map((card) => ({
        card,
        matchScore: matchingAlgorithm.calculateProgramMatchScore(profile, card),
      }))
      .sort((a, b) => b.matchScore - a.matchScore);

    const rush: MatchResult[] = [];
    const stable: MatchResult[] = [];
    const conservative: MatchResult[] = [];

    matchScores.forEach(({ card, matchScore }) => {
      if (rush.length < 5 && matchScore >= 75) {
        rush.push(buildMatchResult(card, matchScore, "冲", generateMatchReasons(profile, card, matchScore)));
      } else if (stable.length < 5 && matchScore >= 60) {
        stable.push(buildMatchResult(card, matchScore, "稳", generateMatchReasons(profile, card, matchScore)));
      } else if (conservative.length < 5) {
        conservative.push(buildMatchResult(card, matchScore, "保", generateMatchReasons(profile, card, matchScore)));
      }
    });

    return {
      userProfile: profile,
      overallScore,
      scoreBreakdown: breakdown,
      results: {
        rush,
        stable,
        conservative,
      },
      createdAt: Date.now(),
    };
  },
};

function generateMatchReasons(profile: UserProfile, card: PublicProgramCard, score: number): string[] {
  const reasons: string[] = [];
  const threshold = resolveTargetThreshold(card);

  if (score >= 75) {
    reasons.push(`你的背景对${threshold.label}仍有竞争力。`);
  } else if (score >= 60) {
    reasons.push("你的条件与该项目基本匹配，适合重点关注。");
  } else {
    reasons.push("这更适合作为保底或补充选择。");
  }

  if (profile.gpa >= threshold.minGPA) {
    reasons.push("GPA 基本达到该层次项目要求。");
  } else {
    reasons.push("GPA 仍是主要短板，需要结合其他优势补强。");
  }

  if (profile.rankingPercentile <= threshold.maxRankingPercentile) {
    reasons.push("你的排名区间具备申请竞争力。");
  }

  if (
    matchingAlgorithm.calculateEnglishScore(profile.hasCET6, profile.cet6Score, profile.hasIELTS, profile.ieltsScore) >=
    threshold.minEnglishScore
  ) {
    reasons.push("英语成绩对申请有帮助。");
  }

  if (hasStrongResearch(profile)) {
    reasons.push("科研或竞赛经历能提高通过率。");
  }

  if (card.verificationStatus === "needs_review") {
    reasons.push("这条信息仍建议回到原始通知进一步核对。");
  }

  return reasons.slice(0, 3);
}
