import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface Reminder {
  id: string;
  universityId: string;
  universityName: string;
  deadline: string;
  reminderDate: number;
  active: boolean;
  createdAt: string;
}

interface ReminderInput {
  universityId: string;
  universityName: string;
  deadline: string;
  reminderDate: number;
  active: boolean;
}

interface ReminderContextType {
  reminders: Reminder[];
  addReminder: (reminder: ReminderInput) => void;
  removeReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
  getReminder: (universityId: string) => Reminder | undefined;
}

const STORAGE_KEY = "university-reminders";

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export function ReminderProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  }, [reminders]);

  const addReminder = (input: ReminderInput) => {
    const existing = reminders.find((r) => r.universityId === input.universityId);
    if (existing) {
      setReminders((prev) =>
        prev.map((r) =>
          r.universityId === input.universityId
            ? { ...r, ...input, id: r.id }
            : r
        )
      );
    } else {
      const newReminder: Reminder = {
        ...input,
        id: `reminder-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setReminders((prev) => [...prev, newReminder]);
    }
  };

  const removeReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  const getReminder = (universityId: string) => {
    return reminders.find((r) => r.universityId === universityId);
  };

  return (
    <ReminderContext.Provider
      value={{ reminders, addReminder, removeReminder, toggleReminder, getReminder }}
    >
      {children}
    </ReminderContext.Provider>
  );
}

export function useReminders() {
  const context = useContext(ReminderContext);
  if (context === undefined) {
    throw new Error("useReminders must be used within a ReminderProvider");
  }
  return context;
}
