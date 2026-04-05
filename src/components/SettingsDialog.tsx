import { useState } from "react";
import { Plus, Trash2, GripVertical, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/lib/useCategories";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabType = "income" | "expense";

const TAB_LABELS: Record<TabType, string> = {
  income: "Thu nhập",
  expense: "Chi tiêu",
};

const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const { categories, addCategory, removeCategory, reorderCategories, resetToDefaults } =
    useCategories();

  const [activeTab, setActiveTab] = useState<TabType>("expense");
  const [newName, setNewName] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const list = categories[activeTab];

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (list.includes(trimmed)) {
      setNewName("");
      return;
    }
    addCategory(activeTab, trimmed);
    setNewName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  // Drag-to-reorder
  const handleDragStart = (i: number) => setDragIndex(i);
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setDragOverIndex(i);
  };
  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const reordered = [...list];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    reorderCategories(activeTab, reordered);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cài đặt danh mục</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(["income", "expense"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setNewName(""); }}
              className={cn(
                "flex-1 py-1.5 text-sm font-medium transition-colors",
                tab === "expense" && "border-l border-border",
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              )}
              data-testid={`tab-settings-${tab}`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Add new */}
        <div className="flex gap-2">
          <Input
            placeholder={`Thêm danh mục ${TAB_LABELS[activeTab].toLowerCase()}...`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-9"
            data-testid="input-new-category"
          />
          <Button
            size="sm"
            className="h-9 px-3 shrink-0"
            onClick={handleAdd}
            disabled={!newName.trim()}
            data-testid="button-add-category"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Category list */}
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          {list.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Chưa có danh mục nào.
            </p>
          )}
          {list.map((cat, i) => (
            <div
              key={cat}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={() => handleDrop(i)}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 bg-card text-sm transition-all select-none",
                dragOverIndex === i && dragIndex !== i
                  ? "border-primary bg-primary/5"
                  : "border-border",
                dragIndex === i && "opacity-40"
              )}
              data-testid={`category-item-${i}`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
              <span className="flex-1 truncate">{cat}</span>
              <button
                onClick={() => removeCategory(activeTab, cat)}
                className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded"
                data-testid={`button-delete-category-${i}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Reset */}
        <div className="flex justify-end border-t border-border pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground text-xs"
            onClick={() => {
              if (confirm("Đặt lại danh mục về mặc định?")) resetToDefaults();
            }}
            data-testid="button-reset-categories"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Đặt lại mặc định
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
