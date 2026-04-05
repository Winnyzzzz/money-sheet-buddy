import express from "express";
import cors from "cors";
import { db } from "./db.js";
import { transactions, marketExpenses } from "./schema.js";
import { and, gte, lt, eq, desc } from "drizzle-orm";

const app = express();
app.use(cors());
app.use(express.json());

// ── Transactions ──────────────────────────────────────────────

app.get("/api/transactions", async (req, res) => {
  try {
    const { start, end } = req.query as { start?: string; end?: string };
    let rows;
    if (start && end) {
      rows = await db
        .select({ id: transactions.id, date: transactions.date, type: transactions.type, category: transactions.category, description: transactions.description, amount: transactions.amount })
        .from(transactions)
        .where(and(gte(transactions.date, start), lt(transactions.date, end)))
        .orderBy(desc(transactions.date));
    } else {
      rows = await db
        .select({ id: transactions.id, date: transactions.date, type: transactions.type, category: transactions.category, description: transactions.description, amount: transactions.amount })
        .from(transactions)
        .orderBy(desc(transactions.date));
    }
    res.json(rows.map(r => ({ ...r, amount: Number(r.amount) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

app.post("/api/transactions", async (req, res) => {
  try {
    const { date, type, category, description, amount } = req.body;
    const [row] = await db
      .insert(transactions)
      .values({ date, type, category, description, amount: String(amount) })
      .returning({ id: transactions.id, date: transactions.date, type: transactions.type, category: transactions.category, description: transactions.description, amount: transactions.amount });
    res.json({ ...row, amount: Number(row.amount) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

app.patch("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.amount !== undefined) updates.amount = String(updates.amount);
    await db.update(transactions).set(updates).where(eq(transactions.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(transactions).where(eq(transactions.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

// ── Market Expenses ───────────────────────────────────────────

app.get("/api/market-expenses", async (req, res) => {
  try {
    const { start, end } = req.query as { start?: string; end?: string };
    let rows;
    if (start && end) {
      rows = await db
        .select({ id: marketExpenses.id, date: marketExpenses.date, description: marketExpenses.description, amount: marketExpenses.amount })
        .from(marketExpenses)
        .where(and(gte(marketExpenses.date, start), lt(marketExpenses.date, end)))
        .orderBy(desc(marketExpenses.date));
    } else {
      rows = await db
        .select({ id: marketExpenses.id, date: marketExpenses.date, description: marketExpenses.description, amount: marketExpenses.amount })
        .from(marketExpenses)
        .orderBy(desc(marketExpenses.date));
    }
    res.json(rows.map(r => ({ ...r, amount: Number(r.amount) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch market expenses" });
  }
});

app.post("/api/market-expenses", async (req, res) => {
  try {
    const { date, description, amount } = req.body;
    const [row] = await db
      .insert(marketExpenses)
      .values({ date, description, amount: String(amount) })
      .returning({ id: marketExpenses.id, date: marketExpenses.date, description: marketExpenses.description, amount: marketExpenses.amount });
    res.json({ ...row, amount: Number(row.amount) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create market expense" });
  }
});

app.patch("/api/market-expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.amount !== undefined) updates.amount = String(updates.amount);
    await db.update(marketExpenses).set(updates).where(eq(marketExpenses.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update market expense" });
  }
});

app.delete("/api/market-expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(marketExpenses).where(eq(marketExpenses.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete market expense" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
