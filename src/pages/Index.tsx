import SummaryCards from "@/components/SummaryCards";
import TransactionGrid from "@/components/TransactionGrid";
import { useTransactions } from "@/hooks/useTransactions";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction, summary } = useTransactions();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Income & Expense Tracker</h1>
          <p className="text-muted-foreground mt-1">Track your daily transactions in one place.</p>
        </div>

        <SummaryCards totalIncome={summary.totalIncome} totalExpenses={summary.totalExpenses} balance={summary.balance} />

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
