import { useState, useCallback } from "react";

const STORAGE_KEY = "thu-chi-categories";

const DEFAULTS = {
  income: ["Lương", "Freelance", "Đầu tư", "Thưởng", "Khác"],
  expense: ["Ăn uống", "Di chuyển", "Tiện ích", "Giải trí", "Mua sắm", "Y tế", "Giáo dục", "Khác"],
};

function load(): { income: string[]; expense: string[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      income: Array.isArray(parsed.income) && parsed.income.length > 0 ? parsed.income : DEFAULTS.income,
      expense: Array.isArray(parsed.expense) && parsed.expense.length > 0 ? parsed.expense : DEFAULTS.expense,
    };
  } catch {
    return DEFAULTS;
  }
}

function save(cats: { income: string[]; expense: string[] }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
}

export function useCategories() {
  const [categories, setCategories] = useState<{ income: string[]; expense: string[] }>(load);

  const addCategory = useCallback((type: "income" | "expense", name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCategories((prev) => {
      if (prev[type].includes(trimmed)) return prev;
      const next = { ...prev, [type]: [...prev[type], trimmed] };
      save(next);
      return next;
    });
  }, []);

  const removeCategory = useCallback((type: "income" | "expense", name: string) => {
    setCategories((prev) => {
      const next = { ...prev, [type]: prev[type].filter((c) => c !== name) };
      save(next);
      return next;
    });
  }, []);

  const reorderCategories = useCallback(
    (type: "income" | "expense", ordered: string[]) => {
      setCategories((prev) => {
        const next = { ...prev, [type]: ordered };
        save(next);
        return next;
      });
    },
    []
  );

  const resetToDefaults = useCallback(() => {
    save(DEFAULTS);
    setCategories(DEFAULTS);
  }, []);

  return { categories, addCategory, removeCategory, reorderCategories, resetToDefaults };
}
