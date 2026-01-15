import { UserProfile, MatchReport } from "@/types/userProfile";

const STORAGE_KEYS = {
  USER_PROFILE: "literature_user_profile",
  MATCH_REPORT: "literature_match_report",
};

export const storageUtils = {
  // 用户信息存储
  saveUserProfile: (profile: UserProfile) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      return true;
    } catch (error) {
      console.error("Failed to save user profile:", error);
      return false;
    }
  },

  getUserProfile: (): UserProfile | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Failed to get user profile:", error);
      return null;
    }
  },

  clearUserProfile: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      return true;
    } catch (error) {
      console.error("Failed to clear user profile:", error);
      return false;
    }
  },

  // 匹配报告存储
  saveMatchReport: (report: MatchReport) => {
    try {
      localStorage.setItem(STORAGE_KEYS.MATCH_REPORT, JSON.stringify(report));
      return true;
    } catch (error) {
      console.error("Failed to save match report:", error);
      return false;
    }
  },

  getMatchReport: (): MatchReport | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MATCH_REPORT);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Failed to get match report:", error);
      return null;
    }
  },

  clearMatchReport: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.MATCH_REPORT);
      return true;
    } catch (error) {
      console.error("Failed to clear match report:", error);
      return false;
    }
  },

  // 清除所有数据
  clearAll: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      localStorage.removeItem(STORAGE_KEYS.MATCH_REPORT);
      return true;
    } catch (error) {
      console.error("Failed to clear all data:", error);
      return false;
    }
  },
};
