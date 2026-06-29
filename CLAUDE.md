# Finance Dashboard — CLAUDE.md

> Personal Income, Expenses & Savings Tracker
> Owner: Kuba (MarTech Developer)
> Repo: https://github.com/Kubalino/finance-tracker
> Live: https://kubalino.github.io/finance-tracker/

---

## Current Status (read this first)

**All 12 originally planned sessions are complete and deployed**, plus several
extras discovered along the way. The app is in daily-use-ready shape:

- Local-first SPA (Dexie/IndexedDB) with optional Supabase cloud sync.
- **Demo mode vs. real account are strictly separate local data spaces** — see
  "Demo Data vs. Account Data" below. This is the single most important
  behavior to understand before touching auth/sync code.
- Auth is **email + password** (not magic link — see "Decisions & Gotchas").
- Categories/keywords in the user's real account are fully custom (Portuguese)
  and migrated from an old spreadsheet export — never hardcode or reference
  the user's real category names in this repo; they live only in Supabase.
- CSV import supports both signed (bank-statement-style) and unsigned
  (all-positive, e.g. old export tools) amount columns via a toggle in the
  column-mapping step.
- Amounts: Income is always positive. Expenses/Savings may be **negative** to
  represent a reimbursement against that same category (net accounting),
  instead of logging the refund as separate Income.

If you're starting a fresh session on this repo, skim "Decisions & Gotchas"
below before making sync/auth/import changes — several of these were
non-obvious bugs that took real debugging effort to find.

---

## Project Overview

Replace an Excel-based budget spreadsheet with a modern, responsive web app. Track income, expenses, and savings across time with visual dashboards, manual entry, and automated bank CSV imports. **No budgeting features initially** — pure tracking and visualization.

### Non-Negotiable Constraints

1. **ZERO data exposure** — No real financial data in code, commits, AI context, or network requests. All development uses sample/fixture data only. Real data lives exclusively in the user's browser (IndexedDB) + Supabase (encrypted, user-controlled).
2. **Git mandatory** — Every feature is a branch. Clean commits. Deploy via GitHub Pages.
3. **Browser-first** — CSV parsing, data entry, and all operations happen in the browser. No terminal interaction required for end-user workflows.
4. **Mobile-responsive** — All features usable on phone screens.
5. **Cross-device sync** — Supabase as cloud persistence layer, IndexedDB as local cache. Manual sync via UI button.

---

## Tech Stack

### Frontend (SPA)
- **React 19** with Vite
- **React Router** — routes: Dashboard (`/`), Tracking, Import, Settings. Pages are lazy-loaded (`React.lazy` + `Suspense`) for code-splitting.
- **Recharts** — charts and data visualization
- **Dexie.js** — IndexedDB wrapper, local-first storage
- **Papa Parse** — in-browser CSV parsing (bank extracts processed client-side)
- **CSS Modules + CSS Variables** — Nord palette from kuba-brand-guidelines
- **Lucide React** — icon system (lightweight, tree-shakeable)

### Data Layer
- **Supabase (free tier)** — PostgreSQL cloud database, single source of truth for a signed-in account
  - Row-level security (RLS) **plus explicit `GRANT`s to the `authenticated` role** — RLS alone is not enough; see Gotchas.
  - Auth via Supabase Auth, email/password
  - REST API — static SPA talks to it directly via `@supabase/supabase-js`
- **IndexedDB** (via Dexie.js) — local-first store; the only data source when logged out (demo mode)
- **Sync model** — manual "Sync Now" button in Settings: push local → Supabase, pull Supabase → local, last-write-wins via `updatedAt` timestamps. Deletions propagate via a `tombstones` table.
- Free Supabase projects **auto-pause after ~7 days of inactivity**. A scheduled GitHub Action (`.github/workflows/keep-alive.yml`) pings the REST API every 4 days to prevent this.

### Bank CSV Processing (In-Browser)
- **Papa Parse** — parses CSV files entirely in the browser
- **Keyword matching engine** — JS-based, matches description fields to categories (longest-match-wins, case-insensitive substring)
- **Column mapping UI** — maps arbitrary CSV columns to date/amount/description, plus a checkbox for whether the file's amounts are signed (bank-statement convention) or all-positive (older export tools, no sign info)
- Raw CSV files never leave the user's machine — only clean transaction fields are saved
- **Python scripts** (in `/scripts/`) remain as optional power-user tools for batch processing — not built out, low priority

### Deployment
- **GitHub Pages** — static SPA hosting, served from `dist/`
- **GitHub Actions** (`.github/workflows/deploy.yml`) — build + deploy on push to `main`. Injects `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` from repo secrets. Also copies `index.html` to `404.html` post-build so direct navigation to client-side routes (e.g. `/tracking`) doesn't 404 on GitHub Pages' static-only hosting.
- **GitHub Actions** (`.github/workflows/keep-alive.yml`) — scheduled cron pinging Supabase to prevent free-tier auto-pause.

---

## Demo Data vs. Account Data

The app has two strictly separate local data spaces, both living in the same Dexie database but never mixed:

- **Logged out → demo mode.** On first load with no Supabase session, `seedDatabase()` fills IndexedDB with English-language fixture data (see Sample Data Contract). This is safe to show to friends/family without exposing real data.
- **Logged in → account mode.** Real data, synced to Supabase, scoped by `user_id` + RLS.

**Transitions** (handled in `App.jsx` via `supabase.auth.onAuthStateChange`):
- **Login**: snapshot the current demo state to `localStorage` (`backupDemoData`), wipe local tables, pull the account's cloud data, reload.
- **Logout**: the *push* of any unsynced local changes happens in `AuthPanel.handleSignOut` **before** calling `supabase.auth.signOut()` (not reactively after — see Gotchas). Then the auth-state listener wipes local tables and restores the demo snapshot taken at the last login (`restoreDemoData`, falling back to fresh `seedDatabase()` if no snapshot exists yet), reloads.

This means demo edits persist across login/logout cycles, and account edits are never silently lost on logout.

---

## Decisions & Gotchas

Non-obvious things discovered during development. Read before changing auth/sync/import code.

1. **Supabase auth callback deadlock**: never `await` other Supabase calls (DB queries, etc.) directly inside `onAuthStateChange`'s callback — it can deadlock on the auth client's internal lock while the triggering call (e.g. `signInWithPassword`) is still resolving. Defer with `setTimeout(fn, 0)`.
2. **Push-before-signOut**: `signOut()` invalidates the session almost immediately. Any push of pending changes must happen *before* calling it (in the UI handler), not in reaction to the resulting `SIGNED_OUT` event — by then the access token is already dead and pushes fail with 401.
3. **RLS is not enough**: Postgres also needs explicit `grant select, insert, update, delete ... to authenticated` on every table. The Supabase Table Editor UI sets this up automatically; the SQL Editor does not. See `supabase/schema.sql`.
4. **GitHub Pages SPA routing**: it only serves static files, so a direct hit to `/tracking` 404s unless a `404.html` (copy of `index.html`) exists — added as a build step in `deploy.yml`. React Router then takes over client-side.
5. **Magic-link auth was tried and reverted**: Supabase's free-tier transactional email has a very low rate limit (a handful per hour), which we hit during testing. Reverted to email + password, which has no such limit. Also: magic-link redirect URLs must match Supabase's configured Site URL/Redirect URLs exactly (including not pointing at `localhost` unless that's where the user will actually click the link).
6. **Clearing data must clear both places**: "Clear All Data" must delete rows in Supabase too, not just wipe local IndexedDB — otherwise the next "Sync Now" pulls everything right back.
7. **CSV sign convention varies by source**: real bank statements typically use negative = money out, positive = money in. Some export tools (e.g. an old personal tracker) export everything as positive with no sign info at all. The "Amounts are signed" checkbox in the column-mapping step controls which interpretation is used; default is signed (bank-statement convention).
8. **Donut chart can't render negative/zero slices**: `DonutChart` filters out any category whose net total is ≤ 0 before passing data to Recharts' `Pie`.
9. **Stray duplicate keyword/category rows**: when bulk-inserting via direct Dexie writes (as opposed to the app's own hooks), always check for duplicates against what's already synced remotely before pushing — a stray sync mid-session can leave an orphaned remote row that a later pull resurrects after you've deleted the local duplicate.
10. **Browser caching after deploy**: GitHub Pages asset filenames are content-hashed, but `index.html` itself can be cached by the browser referencing a now-deleted JS chunk. If the live site looks blank after a deploy, hard refresh (Ctrl+Shift+R) before assuming something's broken.

---

## Data Model

### Transaction (primary entity)
```
{
  id:            string (UUID for manual entries)
  hash:          string | null (SHA-256 of date+|amount|+description for imports — dedup key; null for manual entries)
  date:          string (ISO date, YYYY-MM-DD — when it happened)
  effectiveDate: string (ISO date — which month it counts toward)
  type:          "Income" | "Expenses" | "Savings"
  category:      string (from dynamic category list per type)
  amount:        number — Income always positive. Expenses/Savings normally positive,
                 but may be negative to represent a reimbursement/refund against that
                 same category (e.g. -€80 against a €100 Dinner expense nets to €20).
  details:       string (optional description)
  source:        "manual" | "import" (how it was added)
  importBatch:   string | null (batch ID if imported from CSV)
  createdAt:     string (ISO datetime)
  updatedAt:     string (ISO datetime — drives last-write-wins sync)
}
```

**Deduplication strategy**:
- **Imported transactions**: `hash = SHA-256(date + |amount| + description)` (always the absolute value, regardless of sign). Same bank row imported twice → same hash → duplicate detected and skipped.
- **Manual entries**: `id = UUID` generated at creation. Always unique.

### Categories (fully dynamic — managed from Settings)
Categories are stored in IndexedDB/Supabase, not hardcoded. Users can add, edit,
rename, reorder, and delete categories per type at any time from the Settings page.
Deletion is blocked (with an explanatory dialog) if any transaction still references
that category.

**Default seed categories** (demo mode only — see Sample Data Contract):
```
Income:    ["Employment (Net)", "Side Hustle (Net)", "Dividends"]
Expenses:  ["Housing", "Utilities", "Groceries", "Transportation",
            "Fun & Vacations", "Clothing", "Body Care & Medicine",
            "Media", "Insurances"]
Savings:   ["Emergency Fund", "Retirement Account", "Stock Portfolio"]
```

### CategoryKeyword (for auto-categorization of bank imports)
```
{
  id:        string (UUID)
  keyword:   string (matched against CSV description field, case-insensitive substring, longest-match-wins)
  type:      "Income" | "Expenses" | "Savings"
  category:  string
  updatedAt: string (ISO datetime)
}
```

### AppSettings
```
{
  id:                 "app" (single row)
  lateIncomeShift:    boolean (default: true)
  lateIncomeStartDay: number (default: 20 — income on/after day X counts as next month)
  savingsRateCalc:    "allocated" | "passive"
    — "allocated": Savings / Income
    — "passive":   (Income - Expenses) / Income
  theme:              "dark" | "light" (default: "dark")
  updatedAt:          string (ISO datetime)
}
```

### Tombstones (sync-only, not user-facing)
```
{ id: string (matches the deleted row's id), table: string, deletedAt: string }
```
Recorded locally on every delete so the deletion can propagate to the other side on the next sync, instead of a pull silently resurrecting a deleted row.

---

## App Structure (Pages/Tabs)

### 1. Dashboard (`/`)
**Purpose**: Monthly/yearly overview with KPIs and category breakdowns.

**KPI Cards (top row)**:
- Period completion % (days elapsed / days in month)
- Tracking balance (income - expenses - savings for period)
- Savings rate (configurable calculation)
- Total income for period

**Filters**: Year selector + Month selector (or "Full Year")

**Breakdown Section**: Income / Expenses / Savings tables — category, net amount, total row.

**Charts**:
- Donut charts per type (categories with net total ≤ 0 are filtered out — can't render a negative slice)
- Monthly bar chart: Income vs Expenses vs Savings across the selected year

### 2. Tracking (`/tracking`)
**Purpose**: Full transaction ledger + manual entry.

**Header KPIs**: last entry date, total entries (+ this year), running balance.

**Transaction Table**: sortable columns, filterable by type/category/date range, running balance column, pagination, inline delete with confirmation, click a row to edit.

**Add Entry Form** (modal): Date, Type, Category (dynamic per type), Amount (negative allowed for Expenses/Savings — see Data Model), Details. Effective date auto-calculated from settings.

### 3. Import (`/import`)
**Purpose**: Upload bank CSV files and manage keyword mappings. Two tabs: "Import CSV" and "Keyword Manager".

**Import Flow** (all in-browser):
1. Drag-and-drop or pick a CSV file (Papa Parse reads it client-side; raw file never leaves the browser)
2. Map columns: Date, Amount, Description, plus a toggle for whether amounts are signed (bank convention) or all-positive
3. Keyword engine auto-categorizes known descriptions; SHA-256 hash dedup flags rows already imported
4. Preview table: Description and Amount are both editable inline (lets you tag descriptions for future grouping, e.g. "Málaga - Dinner", and correct a row's amount/sign — changing a row's Type auto-flips the amount's sign to match unless you've already hand-edited it)
5. Confirm → only new, categorized rows are saved

**Keyword Manager**: table of all keyword → category mappings, add/delete, and a live "test a description" widget.

### 4. Settings (`/settings`)
**Purpose**: App configuration, category management, cloud sync, data management. Always shows the Cloud Sync panel even when local data is empty (e.g. signed in on a fresh device, not yet synced) — this is intentional so the sync entry point is never unreachable.

- **Category manager**: add, rename, reorder (up/down), delete per type. Deletion blocked if in use.
- App configuration: late income shift toggle + day threshold, savings rate method.
- **Cloud Sync**: sign in/up (email+password) or sign out, "Sync Now" button, last-synced timestamp.
- **Data management**: export/import JSON backup, "Clear All Data" (requires typing a confirmation phrase; clears both local IndexedDB *and* the synced Supabase account if signed in).

---

## Design System

**MANDATORY**: Follow the `kuba-brand-guidelines` skill for all UI.

### Key Tokens
- **Palette**: Nord — Polar Night backgrounds, Snow Storm light mode, Frost accents, Aurora semantics
- **Fonts**: Outfit (UI text) + JetBrains Mono (numbers, data, amounts)
- **Dark theme default**: bg `#2E3440`, cards `#3B4252`, accent `#88C0D0`
- **Light theme**: bg `#ECEFF4`, cards `#FFFFFF`, accent `#5E81AC`
- **Cards**: 14px radius, subtle frost-blue borders, hover transitions
- **Charts**: Recharts with dashed grids, muted axis text, accent gradients, heavy tooltip shadows

### Responsive Breakpoints
- Mobile: < 640px — single column, stacked cards, **fixed bottom tab bar** (top nav hides)
- Tablet: 640–1024px (2-column grid where appropriate)
- Desktop: > 1024px (full layout as designed)

Mobile-specific: 36–44px touch targets on icon buttons, `font-size: 16px` forced on all inputs/selects (prevents iOS Safari auto-zoom on focus).

---

## Python CSV Parser (`/scripts/`) — OPTIONAL, NOT BUILT

> Power-user tool for batch processing. Not required for normal app usage —
> all primary CSV parsing happens in-browser via Papa Parse. This was never
> actually implemented; low priority unless specifically requested.

---

## File Structure (actual, as of last session)

```
finance-tracker/
  public/
  src/
    components/
      layout/          — AppShell, Navbar (desktop), BottomNav (mobile), ThemeToggle
      dashboard/       — KPICard, BreakdownTable, DonutChart, MonthlyBarChart, ChartTooltip
      tracking/        — TransactionTable, TrackingFilters, AddEntryForm
      import/          — ImportUpload, ColumnMapper, PreviewTable, KeywordManager
      settings/        — CategoryEditor, SettingsForm, AuthPanel, DataManagement
      shared/          — Card, Modal, ConfirmDialog, FilterBar, PageLoader, NeedsSyncState, ErrorBoundary
    hooks/
      useTransactions.js, useCategories.js, useKeywords.js, useSettings.js
      useAuth.js        — Supabase session, sign in/up/out
      useSync.js        — thin wrapper around db/syncEngine for the manual Sync button
      useFilters.js
      ToastContext.js, ToastProvider.jsx, useToast.js — toast notifications
    db/
      index.js          — Dexie instance + versioned schema (v1-v3: added updatedAt, tombstones)
      seed.js            — demo fixture loader (skipped if a Supabase session already exists)
      supabase.js        — Supabase client + isSupabaseConfigured flag
      syncEngine.js       — pushAll/pullAll/syncAll — the actual sync logic, table-mapping aware
      demoBackup.js       — snapshot/restore demo state across login/logout
      reset.js            — wipeLocalData helper
      tombstones.js        — recordTombstone helper
    pages/
      Dashboard.jsx, Tracking.jsx, Import.jsx, Settings.jsx  — all lazy-loaded in App.jsx
    utils/
      calculations.js   — aggregation, running balance, savings rate, monthly totals
      dateUtils.js      — effective date logic, period helpers
      formatters.js     — currency, percentages, date display
      hash.js           — SHA-256 hash generation for dedup
      csvParser.js      — Papa Parse wrapper, amount/date parsing
      keywordEngine.js  — description → category matching
      syncMapping.js     — camelCase (local) <-> snake_case (Supabase) field mapping per table
      chartColors.js
    styles/
      theme.css, global.css
    App.jsx              — routing + the login/logout data-space-switch effect (see Demo vs Account Data)
    main.jsx              — seeds demo data (if applicable) before first render, wraps in ErrorBoundary
  supabase/
    schema.sql            — table definitions, RLS policies, AND the grants RLS alone doesn't cover
  scripts/                — Python CSV parser, not built out
  .github/workflows/
    deploy.yml            — build + deploy, injects Supabase secrets, adds 404.html SPA fallback
    keep-alive.yml         — scheduled ping to prevent Supabase free-tier auto-pause
  .env.local.example       — template for local Supabase env vars (.env.local is gitignored)
  index.html, vite.config.js, package.json
  CLAUDE.md                — this file
  README.md                — setup/deploy/architecture docs for humans
```

---

## Coding Conventions

- **Components**: Functional components with hooks. No class components (except `ErrorBoundary`, which React requires as a class).
- **State**: React state + Dexie.js. No Redux or external state library.
- **Naming**: PascalCase for components, camelCase for functions/variables, kebab-case for CSS files.
- **Formatting**: Prettier defaults. 2-space indent.
- **Amounts**: Income is always stored positive. Expenses and Savings are normally positive, but may be negative to represent a reimbursement/refund against that same category (e.g. you pay €100 for dinner, a friend pays you back €80 — log a second Expenses/Dinner entry of -€80, giving a net €20 cost, instead of recording the refund as Income). Category aggregation, running balance, and savings rate all net out correctly with this convention. Donut charts filter out categories whose net total is ≤ 0, since a negative slice can't be drawn.
- **Dates**: ISO strings (`YYYY-MM-DD`) in storage. Formatted for display via `dateUtils.js`.
- **Currency**: No currency symbol stored. Display formatting adds `€` (EUR).
- **No real data in commits**: Sample data files are clearly marked as fixtures. The user's real categories/keywords/transactions exist only in their browser + their own Supabase project, never in this repo.

---

## Sample Data Contract (demo mode only)

Shown when logged out. Categories and amounts are realistic but entirely fictional — never replace these with the user's real category names.

- **3 income sources**: Employment (Net), Side Hustle (Net), Dividends
- **9 expense categories**: Housing, Utilities, Groceries, Transportation, Fun & Vacations, Clothing, Body Care & Medicine, Media, Insurances
- **3 savings categories**: Emergency Fund, Retirement Account, Stock Portfolio
- **Date range**: Jan 2024 – Mar 2024
- **~57-60 transactions** covering all categories and types
- **6 keyword mappings** (rent, supermarket, electric, transit, salary, dividend)

---

## Future Improvements

Ideas captured for later, not yet built:

- **Trip/tag grouping**: Kuba prefixes related transaction descriptions with a shared tag during import (e.g. "Málaga - Jantar", "Málaga - Bebidas") so they can later be grouped and summed to see total spend on a given trip/event. Needs a way to search/filter transactions by a description prefix and show a running total. The description field is already editable during CSV import preview to support tagging now; the grouping/filtering UI itself isn't built.
- **Bundle size**: main + Dashboard chunks are large (Recharts is the biggest contributor). Route-level code-splitting is already in place; further splitting (e.g. lazy-loading Papa Parse only on the Import page) would be the next lever if load time becomes a concern.
- **Reassign-on-delete for categories**: currently deletion is just blocked if a category is in use. A "reassign transactions to another category, then delete" flow would be more convenient than manually re-editing transactions first.

---

## Security Notes

- The Supabase anon key is safe to expose in frontend code (it's in the deployed JS bundle) — Row-Level Security plus explicit `GRANT`s are what actually protect data, not secrecy of the key.
- `.env.local` (gitignored) holds `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` for local dev; the same two values are set as GitHub Actions repository secrets for the live build.
- Raw bank CSV files are never transmitted — parsed entirely in-browser via Papa Parse.
- No analytics or tracking scripts.
- GitHub Pages serves static files only — no server-side code.
- Export/import uses the local file system for JSON backups — no cloud storage beyond the user's own Supabase project.
