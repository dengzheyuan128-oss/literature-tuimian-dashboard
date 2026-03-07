import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { toast } from "sonner";

import { useProgramCards } from "@/lib/programCards";
import type { University } from "@/types/university";

interface CompareContextType {
  compareList: University[];
  addToCompare: (university: University) => void;
  removeFromCompare: (id: number) => void;
  isInCompare: (id: number) => boolean;
  clearCompare: () => void;
}

const STORAGE_KEY = "university-compare-list";
const MAX_COMPARE_ITEMS = 4;

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const { universities } = useProgramCards();
  const [compareIds, setCompareIds] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as number[]) : [];
    } catch {
      return [];
    }
  });

  const compareList = compareIds
    .map((id) => universities.find((u) => u.id === id))
    .filter((u): u is University => u !== undefined);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compareIds));
  }, [compareIds]);

  const addToCompare = (university: University) => {
    setCompareIds((prev) => {
      if (prev.includes(university.id)) {
        toast.info("该院校已在对比列表中");
        return prev;
      }

      if (prev.length >= MAX_COMPARE_ITEMS) {
        toast.warning(`对比列表最多添加 ${MAX_COMPARE_ITEMS} 所院校`);
        return prev;
      }

      toast.success(`已添加 ${university.name} 到对比列表`);
      return [...prev, university.id];
    });
  };

  const removeFromCompare = (id: number) => {
    setCompareIds((prev) => {
      const university = universities.find((u) => u.id === id);
      if (university) {
        toast.info(`已从对比列表移除 ${university.name}`);
      }
      return prev.filter((item) => item !== id);
    });
  };

  const isInCompare = (id: number) => compareIds.includes(id);

  const clearCompare = () => {
    setCompareIds([]);
    toast.info("已清空对比列表");
  };

  return (
    <CompareContext.Provider
      value={{ compareList, addToCompare, removeFromCompare, isInCompare, clearCompare }}
    >
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
