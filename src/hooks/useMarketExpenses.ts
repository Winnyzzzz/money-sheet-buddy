import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";

export interface MarketExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
}

export function useMarketExpenses(selectedMonth: string) {
  const [expenses, setExpenses] = useState<MarketExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const [year, month] = selectedMonth.split("-").map(Number);
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    try {
      const res = await fetch(`/api/market-expenses?start=${startDate}&end=${endDate}`);
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setExpenses(
        data.map((d: any) => ({
          id: d.id,
          date: d.date,
          description: d.description,
          amount: Number(d.amount),
        }))
      );
    } catch (err) {
      toast.error("Không thể tải chi tiêu đi chợ");
      console.error(err);
    }
    setLoading(false);
  }, [selectedMonth]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = useCallback(async (e: Omit<MarketExpense, "id">) => {
    try {
      const res = await fetch("/api/market-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(e),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setExpenses((prev) => [{ ...data, amount: Number(data.amount) }, ...prev]);
      toast.success("Đã thêm");
    } catch (err) {
      toast.error("Không thể thêm");
      console.error(err);
    }
  }, []);

  const updateExpense = useCallback(async (id: string, updates: Partial<Omit<MarketExpense, "id">>) => {
    try {
      const res = await fetch(`/api/market-expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Request failed");
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, ...updates, amount: updates.amount !== undefined ? Number(updates.amount) : e.amount }
            : e
        )
      );
    } catch (err) {
      toast.error("Không thể cập nhật");
      console.error(err);
    }
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/market-expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Request failed");
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success("Đã xóa");
    } catch (err) {
      toast.error("Không thể xóa");
      console.error(err);
    }
  }, []);

  const total = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  return { expenses, loading, addExpense, updateExpense, deleteExpense, total };
}
