import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { supabase } from "./supabase.js";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export function registerChatRoutes(app: Express): void {
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { messages, month } = req.body as {
        messages: { role: "user" | "assistant"; content: string }[];
        month: string; // "yyyy-MM"
      };

      // Build date range for context
      const [year, m] = month.split("-").map(Number);
      const startDate = `${year}-${String(m).padStart(2, "0")}-01`;
      const endMonth = m === 12 ? 1 : m + 1;
      const endYear = m === 12 ? year + 1 : year;
      const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

      // Fetch financial data as context
      const [{ data: txns }, { data: mktExp }] = await Promise.all([
        supabase
          .from("transactions")
          .select("date, type, category, description, amount")
          .gte("date", startDate)
          .lt("date", endDate)
          .order("date", { ascending: false }),
        supabase
          .from("market_expenses")
          .select("date, description, amount")
          .gte("date", startDate)
          .lt("date", endDate)
          .order("date", { ascending: false }),
      ]);

      const totalIncome = (txns || []).filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
      const totalExpense = (txns || []).filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
      const totalMarket = (mktExp || []).reduce((s: number, e: any) => s + Number(e.amount), 0);

      const formatVND = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
      const monthLabel = new Date(year, m - 1, 1).toLocaleDateString("vi-VN", { month: "long", year: "numeric" });

      const dataContext = `
Dữ liệu tài chính tháng ${monthLabel}:

📊 TỔNG QUAN:
- Tổng thu nhập: ${formatVND(totalIncome)}
- Tổng chi tiêu: ${formatVND(totalExpense)}
- Số dư: ${formatVND(totalIncome - totalExpense)}
- Tổng tiền chợ: ${formatVND(totalMarket)}

📋 DANH SÁCH GIAO DỊCH THU CHI (${(txns || []).length} giao dịch):
${(txns || []).slice(0, 50).map((t: any) =>
  `- [${t.date}] ${t.type === "income" ? "Thu" : "Chi"} | ${t.category} | ${t.description} | ${formatVND(Number(t.amount))}`
).join("\n") || "(Chưa có giao dịch)"}

🛒 DANH SÁCH CHI TIÊU ĐI CHỢ (${(mktExp || []).length} mục):
${(mktExp || []).slice(0, 30).map((e: any) =>
  `- [${e.date}] ${e.description} | ${formatVND(Number(e.amount))}`
).join("\n") || "(Chưa có chi tiêu đi chợ)"}
`.trim();

      const systemPrompt = `Bạn là trợ lý tài chính cá nhân thông minh, tư vấn dựa trên dữ liệu thu chi thực tế của người dùng.

${dataContext}

Hướng dẫn:
- Trả lời bằng tiếng Việt, ngắn gọn và thực tế
- Dùng số liệu cụ thể từ dữ liệu trên khi trả lời
- Đưa ra nhận xét và gợi ý hữu ích khi phù hợp
- Định dạng số tiền theo VNĐ
- Nếu người dùng hỏi về tháng khác mà bạn không có dữ liệu, hãy nói rõ`;

      // Set up SSE streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        max_completion_tokens: 1024,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err: any) {
      console.error("Chat error:", err);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  });
}
