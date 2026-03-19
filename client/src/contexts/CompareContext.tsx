import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { toast } from "sonner";

import { usePublicProgramCards } from "@/lib/publicProgramCards";
import type { PublicProgramCard } from "@/types/publicProgramCard";

interface CompareContextType {
  compareList: PublicProgramCard[];
  addToCompare: (card: PublicProgramCard) => void;
  removeFromCompare: (stableId: string) => void;
  isInCompare: (stableId: string) => boolean;
  clearCompare: () => void;
}

const STORAGE_KEY = "public-program-compare-list";
const MAX_COMPARE_ITEMS = 4;

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const { cards } = usePublicProgramCards({ enabled: true, limit: 200 });
  const [compareIds, setCompareIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });

  const compareList = useMemo(
    () =>
      compareIds
        .map((stableId) => cards.find((card) => card.stableId === stableId || card.id === stableId))
        .filter((card): card is PublicProgramCard => card !== undefined),
    [cards, compareIds],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compareIds));
  }, [compareIds]);

  const addToCompare = (card: PublicProgramCard) => {
    setCompareIds((prev) => {
      if (prev.includes(card.stableId)) {
        toast.info("该项目已在对比列表中");
        return prev;
      }

      if (prev.length >= MAX_COMPARE_ITEMS) {
        toast.warning(`对比列表最多添加 ${MAX_COMPARE_ITEMS} 个项目`);
        return prev;
      }

      toast.success(`已添加 ${card.institutionName} 到对比列表`);
      return [...prev, card.stableId];
    });
  };

  const removeFromCompare = (stableId: string) => {
    setCompareIds((prev) => {
      const card = cards.find((item) => item.stableId === stableId || item.id === stableId);
      if (card) {
        toast.info(`已从对比列表移除 ${card.institutionName}`);
      }
      return prev.filter((item) => item !== stableId);
    });
  };

  const isInCompare = (stableId: string) => compareIds.includes(stableId);

  const clearCompare = () => {
    setCompareIds([]);
    toast.info("已清空对比列表");
  };

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, isInCompare, clearCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
