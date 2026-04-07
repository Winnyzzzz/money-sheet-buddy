import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import TransactionDialog from "@/components/TransactionDialog";
import AmountInput from "@/components/AmountInput";

export interface Transaction {
  id: string;
  date: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
}

interface TransactionGridProps {
  transactions: Transaction[];
  onAdd: (t: Omit<Transaction, "id">) => void;
  onUpdate: (id: string, t: Partial<Omit<Transaction, "id">>) => void;
  onDelete: (id: string) => void;
}

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const TransactionGrid = ({ transactions, onAdd, onUpdate, onDelete }: TransactionGridProps) => {
  const isMobile = useIsMobile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (id: string, field: string, value: string) => {
    setEditingCell({ id, field });
    setEditValue(value);
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const { id, field } = editingCell;
    const val = field === "amount" ? parseFloat(editValue) || 0 : editValue;
    onUpdate(id, { [field]: val });
    setEditingCell(null);
  };

  const cancelEdit = () => setEditingCell(null);

  const isEditing = (id: string, field: string) =>
    editingCell?.id === id && editingCell?.field === field;

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setDialogOpen(true);
  };

  // Mobile: card layout
  if (isMobile) {
    return (
      <div className="space-y-3">
        {transactions.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Chưa có giao dịch nào.
          </div>
        )}

        {transactions.map((t) => (
          <div key={t.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {format(new Date(t.date), "dd/MM/yyyy", { locale: vi })}
              </span>
              <span className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                t.type === "income" ? "bg-income-light text-income" : "bg-expense-light text-expense"
              )}>
                {t.type === "income" ? "Thu nhập" : "Chi tiêu"}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">{t.description || "—"}</p>
                <p className="text-xs text-muted-foreground">{t.category}</p>
              </div>
              <p className={cn(
                "text-base font-mono font-semibold whitespace-nowrap",
                t.type === "income" ? "text-income" : "text-expense"
              )}>
                {t.type === "expense" ? "−" : "+"}{formatVND(t.amount)}
              </p>
            </div>

            <div className="flex justify-end gap-1 pt-1 border-t border-border">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => handleOpenEdit(t)}>
                <Pencil className="h-3 w-3 mr-1" /> Sửa
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={() => onDelete(t.id)}>
                <Trash2 className="h-3 w-3 mr-1" /> Xóa
              </Button>
            </div>
          </div>
        ))}


        <TransactionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          transaction={editingTransaction}
          onSave={onAdd}
          onUpdate={onUpdate}
        />
      </div>
    );
  }

  // Desktop: table layout
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary text-secondary-foreground sticky top-0 z-10">
              <th className="text-left px-4 py-3 font-semibold w-[140px]">Ngày</th>
              <th className="text-left px-4 py-3 font-semibold w-[120px]">Loại</th>
              <th className="text-left px-4 py-3 font-semibold w-[150px]">Danh mục</th>
              <th className="text-left px-4 py-3 font-semibold">Mô tả</th>
              <th className="text-right px-4 py-3 font-semibold w-[160px]">Số tiền</th>
              <th className="px-4 py-3 w-[80px]"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                {/* Date */}
                <td className="px-4 py-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-left hover:text-primary transition-colors">
                        {format(new Date(t.date), "dd/MM/yyyy", { locale: vi })}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={new Date(t.date)}
                        onSelect={(d) => d && onUpdate(t.id, { date: format(d, "yyyy-MM-dd") })}
                        className="p-3 pointer-events-auto"
                        locale={vi}
                      />
                    </PopoverContent>
                  </Popover>
                </td>

                {/* Type */}
                <td className="px-4 py-2">
                  <Select value={t.type} onValueChange={(v) => onUpdate(t.id, { type: v as "income" | "expense" })}>
                    <SelectTrigger className="h-8 border-none shadow-none bg-transparent px-0">
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        t.type === "income" ? "bg-income-light text-income" : "bg-expense-light text-expense"
                      )}>
                        {t.type === "income" ? "Thu nhập" : "Chi tiêu"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Thu nhập</SelectItem>
                      <SelectItem value="expense">Chi tiêu</SelectItem>
                    </SelectContent>
                  </Select>
                </td>

                {/* Category */}
                <td className="px-4 py-2" onDoubleClick={() => startEdit(t.id, "category", t.category)}>
                  {isEditing(t.id, "category") ? (
                    <Input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                      className="h-8"
                    />
                  ) : (
                    <span className="cursor-text">{t.category || "—"}</span>
                  )}
                </td>

                {/* Description */}
                <td className="px-4 py-2" onDoubleClick={() => startEdit(t.id, "description", t.description)}>
                  {isEditing(t.id, "description") ? (
                    <Input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                      className="h-8"
                    />
                  ) : (
                    <span className="cursor-text">{t.description || "—"}</span>
                  )}
                </td>

                {/* Amount */}
                <td className="px-4 py-2 text-right font-mono" onDoubleClick={() => startEdit(t.id, "amount", String(t.amount))}>
                  {isEditing(t.id, "amount") ? (
                    <AmountInput
                      autoFocus
                      value={parseInt(editValue, 10) || 0}
                      onChange={(n) => setEditValue(String(n))}
                      onBlur={commitEdit}
                      onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                      className="h-8 text-right"
                    />
                  ) : (
                    <span className={cn("cursor-text font-medium", t.type === "income" ? "text-income" : "text-expense")}>
                      {t.type === "expense" ? "− " : "+ "}{formatVND(t.amount)}
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-2 flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleOpenEdit(t)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(t.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={editingTransaction}
        onSave={onAdd}
        onUpdate={onUpdate}
      />
    </div>
  );
};

export default TransactionGrid;
