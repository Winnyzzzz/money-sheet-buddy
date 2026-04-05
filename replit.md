# Quản Lý Thu Chi — Finance Tracker

A Vietnamese personal finance tracker for managing income, expenses, and market shopping expenses by month.

## Architecture

**Frontend:** React + Vite (TypeScript), Tailwind CSS, shadcn/ui components, React Router, TanStack Query  
**Backend:** Express.js API server (TypeScript, tsx), Supabase JS client  
**Database:** Supabase PostgreSQL (user-managed, connected via HTTPS)  

## Project Structure

```
src/                  - Frontend React app
  components/         - UI components (TransactionGrid, MarketExpenses, etc.)
  hooks/              - Data hooks (useTransactions, useMarketExpenses)
  pages/              - Page components (Index, NotFound)
  integrations/       - Legacy Supabase types (kept for reference, no longer used)
  lib/                - Utilities (exportExcel, utils)
server/
  index.ts            - Express API server (port 3001)
  db.ts               - Drizzle + pg database connection
  schema.ts           - Drizzle schema (transactions, market_expenses tables)
drizzle.config.ts     - Drizzle Kit config
vite.config.ts        - Vite config (port 5000, proxies /api → localhost:3001)
```

## Running the App

```bash
npm run dev        # Starts both API server (3001) and Vite frontend (5000)
npm run db:push    # Push schema changes to the database
npm run build      # Build frontend for production
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/transactions?start=&end= | List transactions by date range |
| POST | /api/transactions | Create transaction |
| PATCH | /api/transactions/:id | Update transaction |
| DELETE | /api/transactions/:id | Delete transaction |
| GET | /api/market-expenses?start=&end= | List market expenses by date range |
| POST | /api/market-expenses | Create market expense |
| PATCH | /api/market-expenses/:id | Update market expense |
| DELETE | /api/market-expenses/:id | Delete market expense |

## Database Tables

- **transactions** — id, date, type (income/expense), category, description, amount
- **market_expenses** — id, date, description, amount

## Migration Notes (Lovable → Replit)

- Removed Supabase direct client calls from frontend hooks
- Added Express API server as a secure backend layer
- Migrated to Replit PostgreSQL via Drizzle ORM
- Removed `lovable-tagger` from vite config
- Vite now proxies `/api/*` requests to the Express server
