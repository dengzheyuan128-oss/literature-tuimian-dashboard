import { createContext, useContext, useState, ReactNode } from "react";
import { University } from "@/types/university";

interface CompareContextType {
  compareList: University[];
  addToCompare: (university: University) => void;
  removeFromCompare: (id: string) => void;
  isInCompare: (id: string) => boolean;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<University[]>([]);

  const addToCompare = (university: University) => {
    setCompareList((prev) => {
      if (prev.find((u) => u.id === university.id)) {
        return prev;
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, university];
    });
  };

  const removeFromCompare = (id: string) => {
    setCompareList((prev) => prev.filter((u) => u.id !== id));
  };

  const isInCompare = (id: string) => {
    return compareList.some((u) => u.id === id);
  };

  const clearCompare = () => {
    setCompareList([]);
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
