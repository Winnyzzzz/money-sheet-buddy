import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  selectedMonth: string;
}

const SUGGESTIONS = [
  "Tháng này tôi tiêu bao nhiêu?",
  "Phân tích chi tiêu theo danh mục",
  "Tôi có đang tiết kiệm được không?",
  "Khoản chi lớn nhất là gì?",
];

const ChatPanel = ({ selectedMonth }: ChatPanelProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    // Placeholder for assistant streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          month: selectedMonth,
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.content) {
              fullContent += evt.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: fullContent };
                return updated;
              });
            }
            if (evt.done) break;
          } catch {}
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const monthLabel = (() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
  })();

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg px-4 py-3 text-sm font-medium transition-all hover:scale-105 active:scale-95",
          open && "opacity-0 pointer-events-none"
        )}
        data-testid="button-open-chat"
      >
        <MessageCircle className="h-5 w-5" />
        Chat AI
      </button>

      {/* Panel overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end pointer-events-none">
          <div
            className="pointer-events-auto flex flex-col bg-background border border-border shadow-2xl rounded-t-2xl sm:rounded-2xl w-full sm:w-[420px] sm:mr-6 sm:mb-6"
            style={{ height: "min(600px, 90vh)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Trợ lý tài chính</p>
                  <p className="text-xs text-muted-foreground capitalize">{monthLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setMessages([])}
                    title="Xoá lịch sử"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-foreground max-w-[85%]">
                      Xin chào! Tôi có thể giúp bạn phân tích thu chi {monthLabel}. Hãy hỏi bất cứ điều gì!
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 pl-9">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-left text-xs text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn("flex gap-2", msg.role === "user" && "flex-row-reverse")}
                >
                  <div className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    msg.role === "assistant" ? "bg-primary/10" : "bg-secondary"
                  )}>
                    {msg.role === "assistant"
                      ? <Bot className="h-3.5 w-3.5 text-primary" />
                      : <User className="h-3.5 w-3.5 text-foreground" />
                    }
                  </div>
                  <div className={cn(
                    "rounded-2xl px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed",
                    msg.role === "assistant"
                      ? "bg-muted text-foreground rounded-tl-sm"
                      : "bg-primary text-primary-foreground rounded-tr-sm"
                  )}>
                    {msg.content}
                    {msg.role === "assistant" && msg.content === "" && streaming && (
                      <span className="inline-flex gap-1 items-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-border shrink-0">
              <div className="flex gap-2 items-end">
                <Textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder="Hỏi về thu chi của bạn..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={streaming}
                  className="resize-none text-sm min-h-[38px] max-h-[120px]"
                  data-testid="input-chat"
                />
                <Button
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || streaming}
                  data-testid="button-send-chat"
                >
                  {streaming
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />
                  }
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                Enter để gửi · Shift+Enter xuống dòng
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatPanel;
