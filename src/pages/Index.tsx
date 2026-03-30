import { useMemo, useState } from "react";
import { format, subMonths, addMonths } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Loader2, Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SummaryCards from "@/components/SummaryCards";
import TransactionGrid from "@/components/TransactionGrid";
import TransactionDialog from "@/components/TransactionDialog";
import MarketExpenses from "@/components/MarketExpenses";
import { useTransactions } from "@/hooks/useTransactions";
import { useMarketExpenses } from "@/hooks/useMarketExpenses";
import { cn } from "@/lib/utils";
import { exportToExcel } from "@/lib/exportExcel";

type TabKey = "thu-chi" | "di-cho";

const Index = () => {
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction, summary, selectedMonth, setSelectedMonth } = useTransactions();
  const { expenses, loading: marketLoading, addExpense, updateExpense, deleteExpense, total: marketTotal } = useMarketExpenses(selectedMonth);
  const [showDialog, setShowDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("thu-chi");
  const [search, setSearch] = useState("");

  const filteredTransactions = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(t => t.description.toLowerCase().includes(q));
  }, [transactions, search]);

  const filteredExpenses = useMemo(() => {
    if (!search.trim()) return expenses;
    const q = search.toLowerCase();
    return expenses.filter(e => e.description.toLowerCase().includes(q));
  }, [expenses, search]);

  const filteredTotal = useMemo(() => {
    if (activeTab === "thu-chi") {
      return filteredTransactions
        .filter(t => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);
    }
    return filteredExpenses.reduce((s, e) => s + e.amount, 0);
  }, [activeTab, filteredTransactions, filteredExpenses]);

  const monthDate = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }, [selectedMonth]);

  const monthLabel = format(monthDate, "MMMM yyyy", { locale: vi });

  const goPrev = () => {
    const prev = subMonths(monthDate, 1);
    setSelectedMonth(format(prev, "yyyy-MM"));
  };

  const goNext = () => {
    const next = addMonths(monthDate, 1);
    setSelectedMonth(format(next, "yyyy-MM"));
  };

  const goToday = () => {
    const now = new Date();
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  };

  const handleExport = () => {
    if (activeTab === "thu-chi") {
      exportToExcel({
        data: filteredTransactions,
        columns: [
          { key: "date", header: "Ngày" },
          { key: "description", header: "Mô tả" },
          { key: "type", header: "Loại" },
          { key: "category", header: "Danh mục" },
          { key: "amount", header: "Số tiền" },
        ],
        sheetName: "Thu Chi",
        fileName: `thu-chi_${selectedMonth}.xlsx`,
      });
    } else {
      exportToExcel({
        data: filteredExpenses,
        columns: [
          { key: "date", header: "Ngày" },
          { key: "description", header: "Mô tả" },
          { key: "amount", header: "Số tiền" },
        ],
        sheetName: "Đi Chợ",
        fileName: `di-cho_${selectedMonth}.xlsx`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Quản Lý Thu Chi</h1>
            <p className="text-muted-foreground mt-1">Theo dõi thu nhập và chi tiêu hàng ngày.</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goPrev} className="h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button onClick={goToday} className="text-sm font-semibold text-foreground min-w-[140px] text-center capitalize">
              {monthLabel}
            </button>
            <Button variant="outline" size="icon" onClick={goNext} className="h-9 w-9">
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Tab buttons */}
            <div className="flex ml-2 rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setActiveTab("thu-chi")}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === "thu-chi"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                Thu Chi
              </button>
              <button
                onClick={() => setActiveTab("di-cho")}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors border-l border-border",
                  activeTab === "di-cho"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                Đi Chợ
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mô tả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleExport} title="Xuất Excel" className="h-9 w-9 shrink-0">
            <Download className="h-4 w-4" />
          </Button>
        </div>
          {search.trim() && (
            <div className="shrink-0 text-sm font-semibold text-destructive whitespace-nowrap">
              Tổng: {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(filteredTotal)}
            </div>
          )}
        </div>

        {activeTab === "thu-chi" ? (
          <>
            <SummaryCards totalIncome={summary.totalIncome} totalExpenses={summary.totalExpenses} balance={summary.balance} />

            <Button className="w-full" onClick={() => setShowDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Thêm giao dịch
            </Button>

            <TransactionDialog
              open={showDialog}
              onOpenChange={setShowDialog}
              transaction={null}
              onSave={addTransaction}
              onUpdate={updateTransaction}
            />

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <TransactionGrid
                transactions={filteredTransactions}
                onAdd={addTransaction}
                onUpdate={updateTransaction}
                onDelete={deleteTransaction}
              />
            )}
          </>
        ) : (
          <>
            {marketLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <MarketExpenses
                expenses={filteredExpenses}
                total={marketTotal}
                onAdd={addExpense}
                onUpdate={updateExpense}
                onDelete={deleteExpense}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
