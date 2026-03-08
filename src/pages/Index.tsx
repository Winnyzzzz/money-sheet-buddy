import { useMemo, useState } from "react";
import { format, subMonths, addMonths } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SummaryCards from "@/components/SummaryCards";
import TransactionGrid from "@/components/TransactionGrid";
import TransactionDialog from "@/components/TransactionDialog";
import { useTransactions } from "@/hooks/useTransactions";

const Index = () => {
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction, summary, selectedMonth, setSelectedMonth } = useTransactions();
  const [showDialog, setShowDialog] = useState(false);

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
          </div>
        </div>

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
            transactions={transactions}
            onAdd={addTransaction}
            onUpdate={updateTransaction}
            onDelete={deleteTransaction}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
