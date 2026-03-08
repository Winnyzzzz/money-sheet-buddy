import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface SummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const SummaryCards = ({ totalIncome, totalExpenses, balance }: SummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-xl border border-border bg-income-light p-5 flex items-center gap-4">
        <div className="rounded-lg bg-income p-2.5">
          <TrendingUp className="h-5 w-5 text-income-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Total Income</p>
          <p className="text-2xl font-bold text-income">{formatCurrency(totalIncome)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-expense-light p-5 flex items-center gap-4">
        <div className="rounded-lg bg-expense p-2.5">
          <TrendingDown className="h-5 w-5 text-expense-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
          <p className="text-2xl font-bold text-expense">{formatCurrency(totalExpenses)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-balance-light p-5 flex items-center gap-4">
        <div className="rounded-lg bg-balance p-2.5">
          <Wallet className="h-5 w-5 text-balance-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
          <p className="text-2xl font-bold text-balance">{formatCurrency(balance)}</p>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
