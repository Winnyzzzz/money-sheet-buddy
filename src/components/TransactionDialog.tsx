import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/components/TransactionGrid";

const CATEGORIES = [
  "Lương", "Freelance", "Đầu tư", "Ăn uống", "Di chuyển",
  "Tiện ích", "Giải trí", "Mua sắm", "Y tế", "Khác"
];

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  onSave: (data: Omit<Transaction, "id">) => void;
  onUpdate?: (id: string, data: Partial<Omit<Transaction, "id">>) => void;
}

const TransactionDialog = ({ open, onOpenChange, transaction, onSave, onUpdate }: TransactionDialogProps) => {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (transaction) {
      setDate(transaction.date);
      setType(transaction.type);
      setCategory(transaction.category);
      setDescription(transaction.description);
      setAmount(String(transaction.amount));
    } else {
      setDate(format(new Date(), "yyyy-MM-dd"));
      setType("expense");
      setCategory("");
      setDescription("");
      setAmount("");
    }
  }, [transaction, open]);

  const handleSave = () => {
    const amt = parseFloat(amount) || 0;
    if (!category || !description || amt <= 0) return;

    const data = { date, type, category, description, amount: amt };

    if (transaction && onUpdate) {
      onUpdate(transaction.id, data);
    } else {
      onSave(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{transaction ? "Sửa giao dịch" : "Thêm giao dịch"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Date */}
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

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Loại</Label>
            <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Thu nhập</SelectItem>
                <SelectItem value="expense">Chi tiêu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Danh mục</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Input
              placeholder="Nhập mô tả"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label>Số tiền (VNĐ)</Label>
            <Input
              type="number"
              inputMode="numeric"
              step="1000"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button onClick={handleSave}>{transaction ? "Lưu" : "Thêm"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDialog;
