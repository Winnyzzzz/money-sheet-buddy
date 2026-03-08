import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
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

    const { data, error } = await supabase
      .from("market_expenses")
      .select("id, date, description, amount")
      .gte("date", startDate)
      .lt("date", endDate)
      .order("date", { ascending: false });

    if (error) {
      toast.error("Không thể tải chi tiêu đi chợ");
      console.error(error);
    } else {
      setExpenses(
        (data || []).map((d: any) => ({
          id: d.id,
          date: d.date,
          description: d.description,
          amount: Number(d.amount),
        }))
      );
    }
    setLoading(false);
  }, [selectedMonth]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = useCallback(async (e: Omit<MarketExpense, "id">) => {
    const { data, error } = await supabase
      .from("market_expenses")
      .insert({ date: e.date, description: e.description, amount: e.amount })
      .select("id, date, description, amount")
      .single();

    if (error) {
      toast.error("Không thể thêm");
      console.error(error);
    } else if (data) {
      setExpenses((prev) => [{ ...data, amount: Number(data.amount) }, ...prev]);
      toast.success("Đã thêm");
    }
  }, []);

  const updateExpense = useCallback(async (id: string, updates: Partial<Omit<MarketExpense, "id">>) => {
    const { error } = await supabase.from("market_expenses").update(updates).eq("id", id);
    if (error) {
      toast.error("Không thể cập nhật");
      console.error(error);
    } else {
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates, amount: updates.amount !== undefined ? Number(updates.amount) : e.amount } : e))
      );
    }
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const { error } = await supabase.from("market_expenses").delete().eq("id", id);
    if (error) {
      toast.error("Không thể xóa");
      console.error(error);
    } else {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success("Đã xóa");
    }
  }, []);

  const total = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  return { expenses, loading, addExpense, updateExpense, deleteExpense, total };
}
