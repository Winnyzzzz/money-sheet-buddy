import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { parse, isValid, format } from "date-fns";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Mode = "thu-chi" | "di-cho";

interface PreviewRow {
  date: string;
  description: string;
  type?: "income" | "expense";
  category?: string;
  amount: number;
  _error?: string;
}

interface ImportExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  onImported: () => void;
}

const formatVND = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

function parseDate(raw: any): string | null {
  if (!raw) return null;

  // Excel serial number
  if (typeof raw === "number") {
    const d = XLSX.SSF.parse_date_code(raw);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }

  const str = String(raw).trim();

  // Try dd/MM/yyyy
  const d1 = parse(str, "dd/MM/yyyy", new Date());
  if (isValid(d1)) return format(d1, "yyyy-MM-dd");

  // Try yyyy-MM-dd
  const d2 = parse(str, "yyyy-MM-dd", new Date());
  if (isValid(d2)) return format(d2, "yyyy-MM-dd");

  // Try dd-MM-yyyy
  const d3 = parse(str, "dd-MM-yyyy", new Date());
  if (isValid(d3)) return format(d3, "yyyy-MM-dd");

  return null;
}

function parseAmount(raw: any): number {
  if (typeof raw === "number") return Math.abs(raw);
  const str = String(raw).replace(/[^\d.,]/g, "").replace(",", ".");
  return Math.abs(parseFloat(str) || 0);
}

function parseType(raw: any): "income" | "expense" {
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("thu") || s.includes("income") || s === "income") return "income";
  return "expense";
}

function parseRows(sheet: XLSX.WorkSheet, mode: Mode): PreviewRow[] {
  const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return json.map((row) => {
    // Normalize keys (trim + lowercase)
    const keys = Object.keys(row);
    const get = (...names: string[]) => {
      for (const name of names) {
        const key = keys.find((k) => k.trim().toLowerCase() === name.toLowerCase());
        if (key !== undefined) return row[key];
      }
      return "";
    };

    const rawDate = get("Ngày", "ngày", "date", "Date");
    const date = parseDate(rawDate);
    const description = String(get("Mô tả", "mo ta", "description", "Description") || "").trim();
    const rawAmount = get("Số tiền", "so tien", "amount", "Amount");
    const amount = parseAmount(rawAmount);

    const errors: string[] = [];
    if (!date) errors.push("Ngày không hợp lệ");
    if (amount <= 0) errors.push("Số tiền phải > 0");

    if (mode === "thu-chi") {
      const rawType = get("Loại", "loai", "type", "Type");
      const rawCat = get("Danh mục", "danh muc", "category", "Category");
      return {
        date: date || rawDate,
        description,
        type: parseType(rawType),
        category: String(rawCat || "").trim(),
        amount,
        _error: errors.join(", ") || undefined,
      };
    } else {
      return {
        date: date || rawDate,
        description,
        amount,
        _error: errors.join(", ") || undefined,
      };
    }
  });
}

const ImportExcelDialog = ({ open, onOpenChange, mode, onImported }: ImportExcelDialogProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setRows([]);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = (v: boolean) => {
    if (!importing) {
      reset();
      onOpenChange(v);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const parsed = parseRows(ws, mode);
        if (parsed.length === 0) {
          toast.error("File không có dữ liệu hoặc không đúng định dạng");
          return;
        }
        setRows(parsed);
      } catch {
        toast.error("Không thể đọc file. Hãy dùng file .xlsx hoặc .xls");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const validRows = rows.filter((r) => !r._error);
  const errorRows = rows.filter((r) => r._error);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      const endpoint = mode === "thu-chi" ? "/api/transactions/batch" : "/api/market-expenses/batch";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows }),
      });
      if (!res.ok) throw new Error("Import failed");
      const { count } = await res.json();
      toast.success(`Đã nhập ${count} dòng thành công`);
      onImported();
      handleClose(false);
    } catch {
      toast.error("Không thể nhập dữ liệu");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Import Excel — {mode === "thu-chi" ? "Thu Chi" : "Đi Chợ"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Upload zone */}
          {rows.length === 0 && (
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-foreground">Kéo thả file hoặc click để chọn</p>
              <p className="text-sm text-muted-foreground mt-1">Hỗ trợ .xlsx, .xls</p>
              <p className="text-xs text-muted-foreground mt-3">
                {mode === "thu-chi"
                  ? "Cột cần có: Ngày, Loại, Danh mục, Mô tả, Số tiền"
                  : "Cột cần có: Ngày, Mô tả, Số tiền"}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Preview */}
          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">{fileName}</span>
                  <span className="text-xs text-muted-foreground">{rows.length} dòng</span>
                </div>
                <div className="flex items-center gap-3">
                  {errorRows.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3.5 w-3.5" /> {errorRows.length} lỗi (bỏ qua)
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {validRows.length} hợp lệ
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-xs">
                    <thead className="bg-secondary text-secondary-foreground sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold w-[100px]">Ngày</th>
                        {mode === "thu-chi" && (
                          <>
                            <th className="text-left px-3 py-2 font-semibold w-[90px]">Loại</th>
                            <th className="text-left px-3 py-2 font-semibold w-[100px]">Danh mục</th>
                          </>
                        )}
                        <th className="text-left px-3 py-2 font-semibold">Mô tả</th>
                        <th className="text-right px-3 py-2 font-semibold w-[120px]">Số tiền</th>
                        <th className="px-3 py-2 w-[60px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr
                          key={i}
                          className={cn(
                            "border-t border-border",
                            r._error ? "bg-destructive/5 text-destructive" : "hover:bg-muted/40"
                          )}
                        >
                          <td className="px-3 py-1.5">{r.date}</td>
                          {mode === "thu-chi" && (
                            <>
                              <td className="px-3 py-1.5">
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                                  r.type === "income" ? "bg-income-light text-income" : "bg-expense-light text-expense"
                                )}>
                                  {r.type === "income" ? "Thu nhập" : "Chi tiêu"}
                                </span>
                              </td>
                              <td className="px-3 py-1.5">{r.category || "—"}</td>
                            </>
                          )}
                          <td className="px-3 py-1.5">{r.description || "—"}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{formatVND(r.amount)}</td>
                          <td className="px-3 py-1.5 text-center">
                            {r._error
                              ? <AlertCircle className="h-3.5 w-3.5 text-destructive inline" title={r._error} />
                              : <CheckCircle2 className="h-3.5 w-3.5 text-green-500 inline" />
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={reset} className="text-xs">
                Chọn file khác
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={importing}>
            Huỷ
          </Button>
          <Button
            onClick={handleImport}
            disabled={validRows.length === 0 || importing}
          >
            {importing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang nhập...</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" /> Nhập {validRows.length} dòng</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportExcelDialog;
