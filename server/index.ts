import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { supabase } from "./supabase.js";
import { registerChatRoutes } from "./chat.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

// ── Transactions ──────────────────────────────────────────────

app.get("/api/transactions", async (req, res) => {
  try {
    const { start, end } = req.query as { start?: string; end?: string };
    let query = supabase
      .from("transactions")
      .select("id, date, type, category, description, amount")
      .order("date", { ascending: false });

    if (start) query = query.gte("date", start);
    if (end) query = query.lt("date", end);

    const { data, error } = await query;
    if (error) throw error;
    res.json((data || []).map((r: any) => ({ ...r, amount: Number(r.amount) })));
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/transactions", async (req, res) => {
  try {
    const { date, type, category, description, amount } = req.body;
    const { data, error } = await supabase
      .from("transactions")
      .insert({ date, type, category, description, amount })
      .select("id, date, type, category, description, amount")
      .single();
    if (error) throw error;
    res.json({ ...data, amount: Number(data.amount) });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("transactions")
      .update(req.body)
      .eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/transactions/batch", async (req, res) => {
  try {
    const { rows } = req.body as { rows: { date: string; type: string; category: string; description: string; amount: number }[] };
    if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: "No rows" });
    const { error } = await supabase.from("transactions").insert(rows);
    if (error) throw error;
    res.json({ count: rows.length });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Market Expenses ───────────────────────────────────────────

app.get("/api/market-expenses", async (req, res) => {
  try {
    const { start, end } = req.query as { start?: string; end?: string };
    let query = supabase
      .from("market_expenses")
      .select("id, date, description, amount")
      .order("date", { ascending: false });

    if (start) query = query.gte("date", start);
    if (end) query = query.lt("date", end);

    const { data, error } = await query;
    if (error) throw error;
    res.json((data || []).map((r: any) => ({ ...r, amount: Number(r.amount) })));
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/market-expenses", async (req, res) => {
  try {
    const { date, description, amount } = req.body;
    const { data, error } = await supabase
      .from("market_expenses")
      .insert({ date, description, amount })
      .select("id, date, description, amount")
      .single();
    if (error) throw error;
    res.json({ ...data, amount: Number(data.amount) });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/market-expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("market_expenses")
      .update(req.body)
      .eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/market-expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("market_expenses").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/market-expenses/batch", async (req, res) => {
  try {
    const { rows } = req.body as { rows: { date: string; description: string; amount: number }[] };
    if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: "No rows" });
    const { error } = await supabase.from("market_expenses").insert(rows);
    if (error) throw error;
    res.json({ count: rows.length });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

registerChatRoutes(app);

// In production: serve the built Vite frontend from dist/
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "..", "dist");
  app.use(express.static(distPath));
  // All non-API routes → index.html (SPA fallback)
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = process.env.PORT || (process.env.NODE_ENV === "production" ? 5000 : 3001);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
});
