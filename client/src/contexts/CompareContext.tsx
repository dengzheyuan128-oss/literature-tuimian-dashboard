import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { University } from "@/types/university";
import { universities } from "@/lib/dataLoader";
import { toast } from "sonner";

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
  const [compareList, setCompareList] = useState<University[]>(() => {
    // 从localStorage恢复数据
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const ids: number[] = JSON.parse(stored);
      // 根据ID从universities中恢复完整数据
      return ids
        .map(id => universities.find(u => u.id === id))
        .filter((u): u is University => u !== undefined);
    } catch {
      return [];
    }
  });

  // 持久化到localStorage
  useEffect(() => {
    const ids = compareList.map(u => u.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [compareList]);

  const addToCompare = (university: University) => {
    setCompareList((prev) => {
      if (prev.find((u) => u.id === university.id)) {
        toast.info("该院校已在对比列表中");
        return prev;
      }
      if (prev.length >= MAX_COMPARE_ITEMS) {
        toast.warning(`对比列表最多添加${MAX_COMPARE_ITEMS}所院校`);
        return prev;
      }
      toast.success(`已添加 ${university.name} 到对比列表`);
      return [...prev, university];
    });
  };

  const removeFromCompare = (id: number) => {
    setCompareList((prev) => {
      const university = prev.find(u => u.id === id);
      if (university) {
        toast.info(`已从对比列表移除 ${university.name}`);
      }
      return prev.filter((u) => u.id !== id);
    });
  };

  const isInCompare = (id: number) => {
    return compareList.some((u) => u.id === id);
  };

  const clearCompare = () => {
    setCompareList([]);
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
