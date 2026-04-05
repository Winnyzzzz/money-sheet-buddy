import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Plus, Trash2, Pencil, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { MarketExpense } from "@/hooks/useMarketExpenses";
import { printMarketBill } from "@/lib/printMarketBill";

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

interface MarketExpensesProps {
  expenses: MarketExpense[];
  total: number;
  selectedMonth: string;
  onAdd: (e: Omit<MarketExpense, "id">) => void;
  onUpdate: (id: string, e: Partial<Omit<MarketExpense, "id">>) => void;
  onDelete: (id: string) => void;
}

const MarketExpenses = ({ expenses, total, selectedMonth, onAdd, onUpdate, onDelete }: MarketExpensesProps) => {
  const isMobile = useIsMobile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<MarketExpense | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const openAdd = () => {
    setEditingExpense(null);
    setDate(format(new Date(), "yyyy-MM-dd"));
    setDescription("");
    setAmount("");
    setDialogOpen(true);
  };

  const openEdit = (e: MarketExpense) => {
    setEditingExpense(e);
    setDate(e.date);
    setDescription(e.description);
    setAmount(String(e.amount));
    setDialogOpen(true);
  };

  const handleSave = () => {
    const amt = parseFloat(amount) || 0;
    if (!description || amt <= 0) return;
    if (editingExpense) {
      onUpdate(editingExpense.id, { date, description, amount: amt });
    } else {
      onAdd({ date, description, amount: amt });
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Total card */}
      <div className="rounded-xl border border-border bg-accent/50 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Tổng tiền chợ tháng này</p>
          <p className="text-2xl font-bold text-foreground">{formatVND(total)}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
          onClick={() => printMarketBill(expenses, selectedMonth, total)}
          disabled={expenses.length === 0}
          data-testid="button-print-bill"
        >
          <Receipt className="h-4 w-4" />
          Tải bill
        </Button>
      </div>

      <Button className="w-full" onClick={openAdd}>
        <Plus className="h-4 w-4 mr-2" /> Thêm tiền chợ
      </Button>

      {/* List */}
      {expenses.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm">Chưa có dữ liệu đi chợ.</div>
      )}

      {isMobile ? (
        <div className="space-y-3">
          {expenses.map((e) => (
            <div key={e.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(e.date), "dd/MM/yyyy", { locale: vi })}
                </span>
                <span className="text-base font-mono font-semibold text-foreground">
                  {formatVND(e.amount)}
                </span>
              </div>
              <p className="text-sm text-foreground">{e.description || "—"}</p>
              <div className="flex justify-end gap-1 pt-1 border-t border-border">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => openEdit(e)}>
                  <Pencil className="h-3 w-3 mr-1" /> Sửa
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={() => onDelete(e.id)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Xóa
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-secondary-foreground sticky top-0 z-10">
                <th className="text-left px-4 py-3 font-semibold w-[140px]">Ngày</th>
                <th className="text-left px-4 py-3 font-semibold">Mô tả</th>
                <th className="text-right px-4 py-3 font-semibold w-[160px]">Số tiền</th>
                <th className="px-4 py-3 w-[80px]"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-2 text-muted-foreground">
                    {format(new Date(e.date), "dd/MM/yyyy", { locale: vi })}
                  </td>
                  <td className="px-4 py-2">{e.description || "—"}</td>
                  <td className="px-4 py-2 text-right font-mono font-medium">{formatVND(e.amount)}</td>
                  <td className="px-4 py-2 flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEdit(e)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(e.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Sửa tiền chợ" : "Thêm tiền chợ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Ngày</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(new Date(date), "dd/MM/yyyy", { locale: vi })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(date)}
                    onSelect={(d) => d && setDate(format(d, "yyyy-MM-dd"))}
                    className="p-3 pointer-events-auto"
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Input placeholder="Mua gì..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Số tiền (VNĐ)</Label>
              <Input type="number" inputMode="numeric" step="1000" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-lg font-mono" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Huỷ</Button>
            <Button onClick={handleSave}>{editingExpense ? "Lưu" : "Thêm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketExpenses;
