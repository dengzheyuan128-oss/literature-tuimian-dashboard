import { UserProfile, MatchResult, MatchReport } from "@/types/userProfile";
import universitiesData from "@/data/universities.json";
import { University } from "@/types/university";

// 院校层级定义（基于学术实力标准）
const UNIVERSITY_TIERS = {
  "第一梯队": {
    // 全国核心型：北大、北师大、复旦、南大、川大、人大
    minGPA: 3.5,
    minRankingPercentile: 10,
    minCET6: 500,
    researchWeight: 0.4,
    description: "你不申请，会后悔的那种"
  },
  "第二梯队": {
    // 强势研究型：华东师大、浙大、山大、武大、中山、吉大、南开、清华
    minGPA: 3.3,
    minRankingPercentile: 20,
    minCET6: 480,
    researchWeight: 0.35,
    description: "非常值得冲，但需要方向匹配"
  },
  "第三梯队": {
    // 稳健学术型：南师大、陕师大、东北师大、华中师大、苏大、兰大等
    minGPA: 3.0,
    minRankingPercentile: 30,
    minCET6: 450,
    researchWeight: 0.3,
    description: "性价比高、风险可控"
  },
  "第四梯队": {
    // 校内优势型：厦大、湖南师大、华南师大、西南大学等
    minGPA: 2.8,
    minRankingPercentile: 50,
    minCET6: 425,
    researchWeight: 0.25,
    description: "要看清内部结构再决定"
  },
  "第五梯队": {
    // 学校光环型：上交、华科、同济、天大、东大等理工科985
    minGPA: 2.7,
    minRankingPercentile: 60,
    minCET6: 400,
    researchWeight: 0.2,
    description: "别被985/211标签骗了"
  },
};

// 本科院校层次权重
const UNDERGRADUATE_TIER_WEIGHTS = {
  "985": 1.3,
  "211": 1.15,
  "普通": 1.0,
};

interface ScoreBreakdown {
  undergraduateLevel: number;
  gpaAndRanking: number;
  englishLevel: number;
  researchAndCompetition: number;
  practiceExperience: number;
}

export const matchingAlgorithm = {
  // 计算本科院校层次分数
  calculateUndergraduateTierScore: (university: string): number => {
    // 顶尖985院校（100分）
    const top985 = [
      "北京大学", "清华大学", "复旦大学", "上海交通大学", "浙江大学",
      "南京大学", "武汉大学", "中山大学", "四川大学", "华中科技大学",
      "西安交通大学", "中国科学技术大学", "哈尔滨工业大学", "吉林大学",
      "厦门大学", "天津大学", "东南大学", "中国人民大学", "北京师范大学"
    ];
    
    // 其他985及顶尖211院校（85-90分）
    const other985And211 = [
      "华东师范大学", "南京师范大学", "湖南师范大学", "华中师范大学",
      "华南师范大学", "东北师范大学", "陕西师范大学", "西南大学",
      "山东大学", "兰州大学", "南开大学", "同济大学", "中国海洋大学",
      "重庆大学", "中南大学", "湖南大学", "大连理工大学", "东北大学",
      "北京外国语大学", "上海外国语大学", "中央民族大学", "中国传媒大学",
      "中央财经大学", "对外经济贸易大学", "中国政法大学"
    ];
    
    // 其他211院校（75-80分）
    const other211 = [
      "安徽大学", "云南大学", "郑州大学", "暨南大学", "上海大学",
      "苏州大学", "西北大学", "辽宁大学", "内蒙古大学", "延边大学",
      "海南大学", "贵州大学", "广西大学", "新疆大学", "宁夏大学",
      "西藏大学", "石河子大学", "福州大学", "南昌大学", "江南大学",
      "合肥工业大学", "太原理工大学"
    ];
    
    if (top985.includes(university)) return 100;
    if (other985And211.includes(university)) return 85;
    if (other211.includes(university)) return 75;
    return 70; // 普通高校
  },

  // 计算GPA和排名分数
  calculateGPAAndRankingScore: (gpa: number, rankingPercentile: number): number => {
    let score = 0;

    // GPA分数（满分40分）
    if (gpa >= 3.8) score += 40;
    else if (gpa >= 3.6) score += 38;
    else if (gpa >= 3.4) score += 36;
    else if (gpa >= 3.2) score += 34;
    else if (gpa >= 3.0) score += 32;
    else if (gpa >= 2.8) score += 28;
    else if (gpa >= 2.6) score += 24;
    else if (gpa >= 2.4) score += 20;
    else score += 15;

    // 排名百分比分数（满分35分）
    if (rankingPercentile <= 10) score += 35;
    else if (rankingPercentile <= 20) score += 33;
    else if (rankingPercentile <= 30) score += 31;
    else if (rankingPercentile <= 40) score += 29;
    else if (rankingPercentile <= 50) score += 27;
    else if (rankingPercentile <= 60) score += 25;
    else if (rankingPercentile <= 70) score += 20;
    else if (rankingPercentile <= 80) score += 15;
    else score += 10;

    return Math.min(score, 75); // 总分不超过75
  },

  // 计算英语水平分数
  calculateEnglishScore: (
    hasCET6: boolean,
    cet6Score: number,
    hasIELTS: boolean,
    ieltsScore: number
  ): number => {
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

  // 计算科研竞赛分数
  calculateResearchAndCompetitionScore: (
    paperCount: number,
    paperLevel: string,
    projectCount: number,
    projectLevel: string,
    competitionCount: number,
    competitionLevel: string
  ): number => {
    let score = 0;

    // 论文分数（满分20分）
    if (paperCount > 0) {
      const paperLevelWeight =
        paperLevel === "核心期刊"
          ? 3
          : paperLevel === "普通期刊"
            ? 2
            : paperLevel === "会议论文"
              ? 1.5
              : 1;
      score += Math.min(paperCount * paperLevelWeight, 20);
    }

    // 项目分数（满分20分）
    if (projectCount > 0) {
      const projectLevelWeight =
        projectLevel === "国家级"
          ? 4
          : projectLevel === "省级"
            ? 2.5
            : projectLevel === "校级"
              ? 1.5
              : 1;
      score += Math.min(projectCount * projectLevelWeight, 20);
    }

    // 竞赛分数（满分15分）
    if (competitionCount > 0) {
      const competitionLevelWeight =
        competitionLevel === "国家级"
          ? 3
          : competitionLevel === "省级"
            ? 2
            : competitionLevel === "校级"
              ? 1
              : 0.5;
      score += Math.min(competitionCount * competitionLevelWeight, 15);
    }

    return Math.min(score, 55);
  },

  // 计算实践经历分数
  calculatePracticeScore: (
    hasStudentLeadership: boolean,
    hasNationalCompetition: boolean,
    hasProvinceCompetition: boolean,
    hasSchoolCompetition: boolean
  ): number => {
    let score = 0;

    if (hasStudentLeadership) score += 5;
    if (hasNationalCompetition) score += 10;
    if (hasProvinceCompetition) score += 5;
    if (hasSchoolCompetition) score += 3;

    return Math.min(score, 20);
  },

  // 计算总体分数和分项分数
  calculateScores: (profile: UserProfile): ScoreBreakdown => {
    const undergraduateLevel = matchingAlgorithm.calculateUndergraduateTierScore(
      profile.undergraduateUniversity
    );

    const gpaAndRanking = matchingAlgorithm.calculateGPAAndRankingScore(
      profile.gpa,
      profile.rankingPercentile
    );

    const englishLevel = matchingAlgorithm.calculateEnglishScore(
      profile.hasCET6,
      profile.cet6Score,
      profile.hasIELTS,
      profile.ieltsScore
    );

    const researchAndCompetition = matchingAlgorithm.calculateResearchAndCompetitionScore(
      profile.paperCount,
      profile.paperLevel,
      profile.projectCount,
      profile.projectLevel,
      profile.competitionCount,
      profile.competitionLevel
    );

    const practiceExperience = matchingAlgorithm.calculatePracticeScore(
      profile.hasStudentLeadership,
      profile.hasNationalCompetition,
      profile.hasProvinceCompetition,
      profile.hasSchoolCompetition
    );

    return {
      undergraduateLevel,
      gpaAndRanking,
      englishLevel,
      researchAndCompetition,
      practiceExperience,
    };
  },

  // 计算总分（满分100分）
  calculateOverallScore: (breakdown: ScoreBreakdown): number => {
    // 权重分配：本科院校层次 > 绩点排名 > 英语四六级 > 科研竞赛 > 实践经历
    const weights = {
      undergraduateLevel: 0.25,
      gpaAndRanking: 0.3,
      englishLevel: 0.2,
      researchAndCompetition: 0.15,
      practiceExperience: 0.1,
    };

    const normalizedScores = {
      undergraduateLevel: (breakdown.undergraduateLevel / 100) * 100,
      gpaAndRanking: (breakdown.gpaAndRanking / 75) * 100,
      englishLevel: (breakdown.englishLevel / 30) * 100,
      researchAndCompetition: (breakdown.researchAndCompetition / 55) * 100,
      practiceExperience: (breakdown.practiceExperience / 20) * 100,
    };

    const overallScore =
      normalizedScores.undergraduateLevel * weights.undergraduateLevel +
      normalizedScores.gpaAndRanking * weights.gpaAndRanking +
      normalizedScores.englishLevel * weights.englishLevel +
      normalizedScores.researchAndCompetition * weights.researchAndCompetition +
      normalizedScores.practiceExperience * weights.practiceExperience;

    return Math.round(overallScore);
  },

  // 计算与单所院校的匹配度
  calculateUniversityMatchScore: (profile: UserProfile, university: University): number => {
    const breakdown = matchingAlgorithm.calculateScores(profile);
    const baseScore = matchingAlgorithm.calculateOverallScore(breakdown);

    // 根据院校梯队调整分数
    const tierConfig = UNIVERSITY_TIERS[university.tier as keyof typeof UNIVERSITY_TIERS];
    if (!tierConfig) return baseScore;

    let adjustedScore = baseScore;

    // 如果用户条件不符合院校基本要求，降分
    if (profile.gpa < tierConfig.minGPA) {
      adjustedScore -= (tierConfig.minGPA - profile.gpa) * 10;
    }

    if (profile.rankingPercentile > tierConfig.minRankingPercentile) {
      adjustedScore -= (profile.rankingPercentile - tierConfig.minRankingPercentile) * 0.5;
    }

    if (profile.hasCET6 && profile.cet6Score < tierConfig.minCET6) {
      adjustedScore -= (tierConfig.minCET6 - profile.cet6Score) * 0.05;
    }

    return Math.max(adjustedScore, 0);
  },

  // 生成匹配报告
  generateMatchReport: (profile: UserProfile): MatchReport => {
    const breakdown = matchingAlgorithm.calculateScores(profile);
    const overallScore = matchingAlgorithm.calculateOverallScore(breakdown);

    const universities = universitiesData as University[];

    // 计算所有院校的匹配度
    const matchScores = universities.map((uni) => ({
      ...uni,
      matchScore: matchingAlgorithm.calculateUniversityMatchScore(profile, uni),
    }));

    // 按匹配度排序
    matchScores.sort((a, b) => b.matchScore - a.matchScore);

    // 根据匹配度分类（冲、稳、保）
    const rush: MatchResult[] = [];
    const stable: MatchResult[] = [];
    const conservative: MatchResult[] = [];

    matchScores.forEach((uni) => {
      if (rush.length < 5 && uni.matchScore >= 75) {
        rush.push({
          universityId: uni.id,
          universityName: uni.name,
          tier: uni.tier,
          matchScore: uni.matchScore,
          category: "冲",
          reasons: generateMatchReasons(profile, uni, uni.matchScore),
        });
      } else if (stable.length < 5 && uni.matchScore >= 60 && uni.matchScore < 75) {
        stable.push({
          universityId: uni.id,
          universityName: uni.name,
          tier: uni.tier,
          matchScore: uni.matchScore,
          category: "稳",
          reasons: generateMatchReasons(profile, uni, uni.matchScore),
        });
      } else if (conservative.length < 5 && uni.matchScore < 60) {
        conservative.push({
          universityId: uni.id,
          universityName: uni.name,
          tier: uni.tier,
          matchScore: uni.matchScore,
          category: "保",
          reasons: generateMatchReasons(profile, uni, uni.matchScore),
        });
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

// 生成匹配理由
function generateMatchReasons(profile: UserProfile, university: University, score: number): string[] {
  const reasons: string[] = [];

  if (score >= 75) {
    reasons.push("您的综合条件与该校要求匹配度高");
  } else if (score >= 60) {
    reasons.push("您的综合条件与该校要求基本匹配");
  } else {
    reasons.push("您的综合条件与该校要求有一定差距");
  }

  if (profile.gpa >= 3.5) {
    reasons.push("GPA成绩优秀");
  }

  if (profile.rankingPercentile <= 30) {
    reasons.push("排名靠前");
  }

  if (profile.hasCET6 && profile.cet6Score >= 500) {
    reasons.push("英语水平达到要求");
  }

  if (profile.paperCount > 0 || profile.projectCount > 0) {
    reasons.push("具有科研成果");
  }

  return reasons.slice(0, 3); // 最多显示3个理由
}
