# Finance Tracker

A personal income, expenses & savings tracker — a modern replacement for an Excel budget spreadsheet. Track money across time with visual dashboards, manual entry, and automated bank CSV imports.

**Live app:** https://kubalino.github.io/finance-tracker/

> The live app shows demo/sample data by default so it's safe to explore or show to friends and family. Sign in to sync your own real data via Supabase — demo data and your account data are kept completely separate.

## Features

- **Dashboard** — KPIs (period completion, tracking balance, savings rate, income), category breakdowns, donut charts, monthly bar chart
- **Tracking** — sortable/filterable transaction ledger with running balance, full add/edit/delete CRUD
- **Import** — drag-and-drop bank CSV upload, column mapping, SHA-256 hash-based dedup, keyword-based auto-categorization
- **Settings** — category management (add/rename/reorder/delete), app configuration (late-income shift, savings rate method), JSON export/import, full data reset
- **Cloud Sync** — optional email/password account, push/pull sync to Supabase, last-write-wins conflict resolution, works across devices
- **Mobile-first** — responsive layout with a bottom tab bar, dark/light Nord-themed UI

## Tech Stack

- **React 19** + **Vite** — SPA framework and build tooling
- **React Router** — client-side routing
- **Dexie.js** — IndexedDB wrapper for local-first storage
- **Supabase** — Postgres + Auth for optional cloud sync
- **Recharts** — dashboard charts
- **Papa Parse** — in-browser CSV parsing (bank files never leave the browser)
- **Lucide React** — icons
- **CSS Modules** — Nord-palette theming, no CSS framework

## Getting Started

```bash
npm install
npm run dev       # start dev server at localhost:5173
npm run build     # production build to dist/
npm run lint      # eslint
```

The app works fully offline-first with no setup — it seeds itself with sample data in IndexedDB on first load.

### Optional: Cloud Sync (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor (creates tables, RLS policies, and grants).
3. Copy `.env.local.example` to `.env.local` and fill in your Project URL + anon public key:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. Restart the dev server. The Settings page will now show a Cloud Sync sign-in form instead of "not configured."

Without these env vars, the app runs in local-only (demo) mode — no code changes needed.

## Deployment

Deploys automatically to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to `main`. If using Supabase, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository secrets (Settings → Secrets and variables → Actions) so the live build picks them up.

A `404.html` fallback (copied from `index.html` at build time) lets direct navigation to client-side routes (e.g. `/tracking`) work correctly on GitHub Pages' static hosting.

## Project Structure

```
src/
  components/    UI components grouped by feature (dashboard, tracking, import, settings, layout, shared)
  hooks/         Data hooks (useTransactions, useCategories, useKeywords, useSettings, useAuth, useSync, ...)
  db/            Dexie schema, seed data, Supabase client, sync engine, reset/tombstone helpers
  pages/         Top-level routed pages
  utils/         Calculations, formatters, CSV parsing, keyword matching, date logic
  styles/        Nord theme CSS variables + global styles
supabase/
  schema.sql     Postgres schema, RLS policies, and grants for cloud sync
scripts/         Optional Python CSV parser for power users (not required for normal use)
```

## Data Model

Transactions are categorized as `Income`, `Expenses`, or `Savings`, with a dynamic per-type category list managed from Settings. Imported transactions are deduplicated via a SHA-256 hash of `date + amount + description`; manually-entered transactions use a UUID. See [`CLAUDE.md`](CLAUDE.md) for the full data model and project specification this app was built against.

## Security & Privacy

- Bank CSV files are parsed entirely in the browser — raw files never leave your machine.
- Real data lives in IndexedDB (local) and, optionally, your own Supabase project (cloud) — never in this repository.
- The Supabase anon key is safe to expose in frontend code; Row-Level Security policies ensure each account can only read/write its own rows.
