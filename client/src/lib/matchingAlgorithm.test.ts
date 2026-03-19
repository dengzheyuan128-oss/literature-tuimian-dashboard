import { describe, expect, it, vi } from "vitest";

import type { UserProfile } from "@/types/userProfile";

vi.mock("@/lib/publicProgramCards", async () => {
  const actual = await vi.importActual<typeof import("@/lib/publicProgramCards")>("@/lib/publicProgramCards");
  return {
    ...actual,
    getPublicProgramCards: vi.fn(),
  };
});

import * as publicProgramCards from "@/lib/publicProgramCards";
import { matchingAlgorithm } from "@/lib/matchingAlgorithm";

function buildProfile(): UserProfile {
  return {
    undergraduateUniversity: "北京大学",
    undergraduateMajor: "中国语言文学",
    gpa: 3.8,
    ranking: 3,
    rankingPercentile: 5,
    paperCount: 1,
    paperLevel: "核心期刊",
    projectCount: 1,
    projectLevel: "国家级",
    projectRole: "主持人",
    competitionCount: 1,
    competitionLevel: "国家级",
    researchInterests: ["中国文学"],
    researchDescription: "关注文学研究",
    hasStudentLeadership: true,
    studentLeadershipPosition: "班长",
    hasNationalCompetition: true,
    hasProvinceCompetition: false,
    hasSchoolCompetition: false,
    practiceExperience: "志愿服务",
    hasCET4: true,
    cet4Score: 620,
    hasCET6: true,
    cet6Score: 550,
    hasIELTS: false,
    ieltsScore: 0,
    hasTOEFL: false,
    toeflScore: 0,
    hasRecommendationQualification: true,
    targetCities: ["北京"],
    degreePreference: "学硕",
    remarks: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe("matchingAlgorithm", () => {
  it("builds reports from the public read model boundary", async () => {
    const getPublicProgramCardsMock = vi.mocked(publicProgramCards.getPublicProgramCards);
    getPublicProgramCardsMock.mockReset();
    getPublicProgramCardsMock.mockResolvedValue([
      {
        id: "card-1",
        stableId: "card-1",
        legacyId: 1,
        institutionName: "北京大学",
        programName: "中国语言文学",
        tier: "985",
        institutionTags: ["985", "211", "双一流"],
        degreeType: "学硕",
        applicationPeriod: "2026-06-01 - 2026-06-10",
        deadline: "2026-06-10",
        sourceUrl: "https://example.com/pku",
        availabilityStatus: "current",
        verificationStatus: "verified",
        examForm: "面试",
        englishRequirement: "CET6",
        dataStatus: "COMPLETE",
        dataVerified: true,
        url: "https://example.com/pku",
      },
    ]);

    const report = await matchingAlgorithm.generateMatchReport(buildProfile());

    expect(getPublicProgramCardsMock).toHaveBeenCalledTimes(1);
    expect(report.results.rush.length + report.results.stable.length + report.results.conservative.length).toBe(1);
    expect(
      report.results.rush[0]?.universityId ??
        report.results.stable[0]?.universityId ??
        report.results.conservative[0]?.universityId,
    ).toBe(1);
    expect(
      report.results.rush[0]?.universityName ??
        report.results.stable[0]?.universityName ??
        report.results.conservative[0]?.universityName,
    ).toBe("北京大学");
  });
});
