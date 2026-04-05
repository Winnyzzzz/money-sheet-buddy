import { pgTable, uuid, date, text, numeric, timestamp, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull().default(sql`CURRENT_DATE`),
  type: text("type").notNull(),
  category: text("category").notNull().default(""),
  description: text("description").notNull().default(""),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const marketExpenses = pgTable("market_expenses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull().default(sql`CURRENT_DATE`),
  description: text("description").notNull().default(""),
  amount: numeric("amount").notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});
