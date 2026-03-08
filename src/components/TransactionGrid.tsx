import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Plus, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

const CATEGORIES = [
  "Lương", "Freelance", "Đầu tư", "Ăn uống", "Di chuyển",
  "Tiện ích", "Giải trí", "Mua sắm", "Y tế", "Khác"
];

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const emptyRow = (): Omit<Transaction, "id"> => ({
  date: format(new Date(), "yyyy-MM-dd"),
  type: "expense",
  category: "",
  description: "",
  amount: 0,
});

const TransactionGrid = ({ transactions, onAdd, onUpdate, onDelete }: TransactionGridProps) => {
  const [newRow, setNewRow] = useState<Omit<Transaction, "id"> | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

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

  const handleAddRow = () => {
    if (!newRow) return;
    if (!newRow.category || !newRow.description || newRow.amount <= 0) return;
    onAdd(newRow);
    setNewRow(null);
  };

  const isEditing = (id: string, field: string) =>
    editingCell?.id === id && editingCell?.field === field;

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
              <th className="px-4 py-3 w-[60px]"></th>
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
                    <Input
                      autoFocus
                      type="number"
                      step="1000"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                      className="h-8 text-right"
                    />
                  ) : (
                    <span className={cn("cursor-text font-medium", t.type === "income" ? "text-income" : "text-expense")}>
                      {t.type === "expense" ? "- " : "+ "}{formatVND(t.amount)}
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(t.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}

            {/* New row */}
            {newRow && (
              <tr className="border-t border-border bg-muted/30">
                <td className="px-4 py-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-left text-sm">{format(new Date(newRow.date), "dd/MM/yyyy", { locale: vi })}</button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={new Date(newRow.date)}
                        onSelect={(d) => d && setNewRow({ ...newRow, date: format(d, "yyyy-MM-dd") })}
                        className="p-3 pointer-events-auto"
                        locale={vi}
                      />
                    </PopoverContent>
                  </Popover>
                </td>
                <td className="px-4 py-2">
                  <Select value={newRow.type} onValueChange={(v) => setNewRow({ ...newRow, type: v as "income" | "expense" })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Thu nhập</SelectItem>
                      <SelectItem value="expense">Chi tiêu</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-2">
                  <Select value={newRow.category} onValueChange={(v) => setNewRow({ ...newRow, category: v })}>
                    <SelectTrigger className="h-8"><SelectValue placeholder="Danh mục" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-2">
                  <Input placeholder="Mô tả" value={newRow.description} onChange={(e) => setNewRow({ ...newRow, description: e.target.value })} className="h-8" />
                </td>
                <td className="px-4 py-2">
                  <Input type="number" step="1000" placeholder="0" value={newRow.amount || ""} onChange={(e) => setNewRow({ ...newRow, amount: parseFloat(e.target.value) || 0 })} className="h-8 text-right font-mono" />
                </td>
                <td className="px-4 py-2 flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-income" onClick={handleAddRow}><Check className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setNewRow(null)}><X className="h-4 w-4" /></Button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!newRow && (
        <div className="p-3 border-t border-border">
          <Button variant="ghost" className="w-full text-muted-foreground hover:text-primary" onClick={() => setNewRow(emptyRow())}>
            <Plus className="h-4 w-4 mr-2" /> Thêm giao dịch
          </Button>
        </div>
      )}
    </div>
  );
};

export default TransactionGrid;
