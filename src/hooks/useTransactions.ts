import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Transaction } from "@/components/TransactionGrid";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const [year, month] = selectedMonth.split("-").map(Number);
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    const { data, error } = await supabase
      .from("transactions")
      .select("id, date, type, category, description, amount")
      .gte("date", startDate)
      .lt("date", endDate)
      .order("date", { ascending: false });

    if (error) {
      toast.error("Không thể tải giao dịch");
      console.error(error);
    } else {
      setTransactions(
        (data || []).map((d: any) => ({
          id: d.id,
          date: d.date,
          type: d.type as "income" | "expense",
          category: d.category,
          description: d.description,
          amount: Number(d.amount),
        }))
      );
    }
    setLoading(false);
  }, [selectedMonth]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = useCallback(async (t: Omit<Transaction, "id">) => {
    const { data, error } = await supabase
      .from("transactions")
      .insert({ date: t.date, type: t.type, category: t.category, description: t.description, amount: t.amount })
      .select("id, date, type, category, description, amount")
      .single();

    if (error) {
      toast.error("Không thể thêm giao dịch");
      console.error(error);
    } else if (data) {
      setTransactions((prev) => [
        { ...data, type: data.type as "income" | "expense", amount: Number(data.amount) },
        ...prev,
      ]);
      toast.success("Đã thêm giao dịch");
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Omit<Transaction, "id">>) => {
    const { error } = await supabase.from("transactions").update(updates).eq("id", id);
    if (error) {
      toast.error("Không thể cập nhật");
      console.error(error);
    } else {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates, amount: updates.amount !== undefined ? Number(updates.amount) : t.amount } : t))
      );
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      toast.error("Không thể xóa");
      console.error(error);
    } else {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast.success("Đã xóa giao dịch");
    }
  }, []);

  const summary = useMemo(() => {
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses };
  }, [transactions]);

  return { transactions, loading, addTransaction, updateTransaction, deleteTransaction, summary, selectedMonth, setSelectedMonth };
}
