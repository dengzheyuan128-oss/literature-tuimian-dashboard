import { UserProfile, MatchReport } from "@/types/userProfile";

const STORAGE_KEYS = {
  USER_PROFILE: "literature_user_profile",
  MATCH_REPORT: "literature_match_report",
  FAVORITES: "literature_favorites",
  SEARCH_HISTORY: "literature_search_history",
};

// Favorites storage
interface FavoriteItem {
  universityId: string;
  universityName: string;
  addedAt: string;
}

export const favoritesStorage = {
  getFavorites: (): FavoriteItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to get favorites:", error);
      return [];
    }
  },

  addFavorite: (item: Omit<FavoriteItem, "addedAt">) => {
    try {
      const favorites = favoritesStorage.getFavorites();
      if (favorites.some((f) => f.universityId === item.universityId)) {
        return false;
      }
      favorites.push({ ...item, addedAt: new Date().toISOString() });
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      return true;
    } catch (error) {
      console.error("Failed to add favorite:", error);
      return false;
    }
  },

  removeFavorite: (universityId: string) => {
    try {
      const favorites = favoritesStorage.getFavorites();
      const filtered = favorites.filter((f) => f.universityId !== universityId);
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      return false;
    }
  },

  isFavorite: (universityId: string): boolean => {
    return favoritesStorage.getFavorites().some((f) => f.universityId === universityId);
  },
};

// Search history storage
export const searchHistoryStorage = {
  getHistory: (): string[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to get search history:", error);
      return [];
    }
  },

  addSearch: (term: string) => {
    try {
      const history = searchHistoryStorage.getHistory();
      const filtered = history.filter((h) => h !== term);
      filtered.unshift(term);
      const limited = filtered.slice(0, 20); // Keep last 20 searches
      localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(limited));
      return true;
    } catch (error) {
      console.error("Failed to add search:", error);
      return false;
    }
  },

  clearHistory: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
      return true;
    } catch (error) {
      console.error("Failed to clear search history:", error);
      return false;
    }
  },
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
