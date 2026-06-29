# Finance Dashboard — CLAUDE.md

> Personal Income, Expenses & Savings Tracker
> Owner: Kuba (MarTech Developer)
> Repo: GitHub Pages hosted SPA

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
- **React 18+** with Vite
- **React Router** — tab-based navigation (Dashboard, Tracking, Import, Settings)
- **Recharts** — charts and data visualization
- **Dexie.js** — IndexedDB wrapper for local cache
- **Papa Parse** — in-browser CSV parsing (bank extracts processed client-side)
- **CSS Modules + CSS Variables** — Nord palette from kuba-brand-guidelines
- **Lucide React** — icon system (lightweight, tree-shakeable)

### Data Layer
- **Supabase (free tier)** — PostgreSQL cloud database, single source of truth
  - Row-level security (RLS) — only authenticated user can read/write
  - Auth via Supabase Auth (email/password or magic link)
  - REST API — static SPA talks to it directly
  - Encrypted at rest, no intermediaries
- **IndexedDB** (via Dexie.js) — local cache for fast reads + offline capability
- **Sync model** — manual "Sync" button: push local → Supabase, pull Supabase → local
- **JSON fixtures** — sample data for development/testing only

### Bank CSV Processing (In-Browser)
- **Papa Parse** — parses CSV files entirely in the browser
- **Keyword matching engine** — JS-based, matches description fields to categories
- **Column mapping config** — configurable per bank format (start with 1 generic format)
- Raw CSV files never leave the user's machine — only clean transaction fields are saved
- **Python scripts** (in `/scripts/`) remain as optional power-user tools for batch processing

### Deployment
- **GitHub Pages** — static SPA hosting
- **GitHub Actions** — CI/CD for build + deploy on push to main
- **Vite build** — optimized static output

---

## Data Model

### Transaction (primary entity)
```
{
  id:            string (UUID for manual entries)
  hash:          string (SHA-256 of date+amount+description for imports — dedup key)
  date:          string (ISO date, YYYY-MM-DD — when it happened)
  effectiveDate: string (ISO date — which month it counts toward)
  type:          "Income" | "Expenses" | "Savings"
  category:      string (from dynamic category list per type)
  amount:        number (always positive, type determines sign)
  details:       string (optional description)
  source:        "manual" | "import" (how it was added)
  importBatch:   string | null (batch ID if imported from CSV)
  createdAt:     string (ISO datetime)
}
```

**Deduplication strategy**:
- **Imported transactions**: `hash = SHA-256(date + amount + description)`. Same bank row imported twice → same hash → duplicate detected and skipped.
- **Manual entries**: `id = UUID` generated at creation. Always unique.

### Categories (fully dynamic — managed from Settings)
Categories are stored in IndexedDB/Supabase, not hardcoded. Users can add, edit,
rename, and delete categories per type at any time from the Settings page.

**Default seed categories** (loaded on first run):
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
  id:       string (UUID)
  keyword:  string (matched against CSV description field, case-insensitive)
  type:     "Income" | "Expenses" | "Savings"
  category: string
}
```

### AppSettings
```
{
  lateIncomeShift:    boolean (default: true)
  lateIncomeStartDay: number (default: 20 — income on/after day X counts as next month)
  savingsRateCalc:    "allocated" | "passive"
    — "allocated": Savings / Income
    — "passive":   (Income - Expenses) / Income
  theme:              "dark" | "light" (default: "dark")
}
```

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

**Breakdown Section**:
- Income table: category, tracked amount, with totals
- Expenses table: category, tracked amount, with totals
- Savings table: category, tracked amount, with totals

**Charts**:
- Donut charts: Income by category, Expenses by category, Savings by category
- Bar chart: Monthly tracked totals (Income vs Expenses vs Savings) across year

### 2. Tracking (`/tracking`)
**Purpose**: Full transaction ledger + manual entry.

**Header KPIs**:
- Date of last entry
- Number of entries (total + current year)
- Running balance

**Transaction Table**:
- Sortable columns: Date, Type, Category, Amount, Details, Effective Date
- Filterable by type, category, date range
- Inline edit capability
- Delete with confirmation

**Add Entry Form**:
- Date picker, Type selector, Category selector (filtered by type), Amount, Details
- Effective date auto-calculated from settings (late income shift logic)
- Validation before save

### 3. Import (`/import`)
**Purpose**: Upload bank CSV files directly and manage keyword mappings.

**Import Flow** (all in-browser):
1. User exports CSV from bank portal (download to local machine)
2. User uploads CSV file into app Import page
3. Papa Parse reads file in browser — raw CSV never leaves the machine
4. Keyword engine auto-categorizes known descriptions
5. Dedup check: hash each row, flag duplicates already in DB
6. User reviews preview table, adjusts categories for unmatched rows
7. Confirm → only clean fields (date, amount, category, details) saved to IndexedDB + Supabase

**Keyword Manager**:
- Table of all keyword → category mappings
- Add new keyword mapping
- Edit/delete existing mappings
- Test: paste a description, see which category it matches

### 4. Settings (`/settings`)
**Purpose**: App configuration and category management.

- **Category manager** (prominent): Add, rename, reorder, delete categories per type (Income/Expenses/Savings). This is a first-class feature, not buried in a submenu.
- Late income shift toggle + day threshold
- Savings rate calculation method
- Theme toggle (dark/light)
- Sync controls: Manual sync button, last sync timestamp, sync status
- Data management: Export all data as JSON, Import backup JSON, Clear all data (with confirmation)

---

## Design System

**MANDATORY**: Follow `/mnt/skills/user/kuba-brand-guidelines/SKILL.md` for all UI.

### Key Tokens
- **Palette**: Nord — Polar Night backgrounds, Snow Storm light mode, Frost accents, Aurora semantics
- **Fonts**: Outfit (UI text) + JetBrains Mono (numbers, data, amounts)
- **Dark theme default**: bg `#2E3440`, cards `#3B4252`, accent `#88C0D0`
- **Light theme**: bg `#ECEFF4`, cards `#FFFFFF`, accent `#5E81AC`
- **Cards**: 14px radius, subtle frost-blue borders, hover transitions
- **Charts**: Recharts with dashed grids, muted axis text, accent gradients, heavy tooltip shadows

### Responsive Breakpoints
- Mobile: < 640px (single column, stacked cards, hamburger nav)
- Tablet: 640–1024px (2-column grid where appropriate)
- Desktop: > 1024px (full layout as designed)

---

## Python CSV Parser (`/scripts/`) — OPTIONAL

> Power-user tool for batch processing. Not required for normal app usage.
> All primary CSV parsing happens in-browser via Papa Parse.

### Structure
```
scripts/
  parse_bank_csv.py      — Main CLI entry point
  parsers/
    __init__.py
    base.py              — Base parser class
    generic.py           — Generic CSV parser (single format)
  config/
    keywords.json        — Keyword-to-category mapping (mirrors app's keyword DB)
  output/                — Generated JSON files (gitignored)
```

---

## Development Sessions

Each session is designed to produce a working, deployable increment.
Target: ~1-2 hours per session in Claude Code.

### Session 1: Scaffold + Deploy
**Goal**: Empty app deployed to GitHub Pages, proving the full pipeline works.
- [ ] `npm create vite@latest finance-dashboard -- --template react`
- [ ] Install dependencies: react-router-dom, recharts, dexie, papaparse, lucide-react
- [ ] Basic `App.jsx` with React Router (4 routes: /, /tracking, /import, /settings)
- [ ] Nord theme CSS variables (dark + light modes) from kuba-brand-guidelines
- [ ] Global styles: fonts (Outfit + JetBrains Mono), resets, CSS variables
- [ ] GitHub repo init + push
- [ ] GitHub Actions workflow for build + deploy to GitHub Pages
- [ ] **Deliverable**: Live URL showing empty themed app with working navigation

### Session 2: Data Layer + Sample Data
**Goal**: Dexie.js schema, sample data seeded, data hooks ready.
- [ ] Dexie.js database schema (transactions, categories, keywords, settings tables)
- [ ] Seed script with ~60 sample transactions (Jan–Mar 2024, all categories)
- [ ] Default category seed (Income/Expenses/Savings lists)
- [ ] `useTransactions` hook (CRUD + queries by date range, type, category)
- [ ] `useCategories` hook (CRUD + list by type)
- [ ] `useSettings` hook (read/update app settings)
- [ ] `useFilters` hook (year/month state management)
- [ ] Effective date calculation utility (late income shift logic)
- [ ] Currency + date formatting utilities
- [ ] **Deliverable**: App loads with sample data visible in console, all hooks tested

### Session 3: App Shell + Navigation
**Goal**: Full responsive layout with nav, theme toggle, and shared components.
- [ ] AppShell layout component (sidebar on desktop, bottom nav on mobile)
- [ ] Navbar with tab links + active state styling
- [ ] ThemeToggle component (dark/light switch, persisted to settings)
- [ ] Shared Card component (reusable container with Nord styling)
- [ ] Shared FilterBar component (Year + Month selectors)
- [ ] Responsive breakpoint handling
- [ ] Page placeholder components (Dashboard, Tracking, Import, Settings)
- [ ] **Deliverable**: Navigable app with working theme toggle, responsive layout

### Session 4: Dashboard — KPIs + Breakdown Tables
**Goal**: Dashboard page with live data from sample transactions.
- [ ] KPICard component (period completion, tracking balance, savings rate, total income)
- [ ] Wire KPI calculations to `useTransactions` + `useFilters`
- [ ] BreakdownTable component (category | tracked amount | total row)
- [ ] Three breakdown tables: Income, Expenses, Savings
- [ ] Filter controls wired to dashboard data
- [ ] Color-coded type indicators (green/red/blue for Income/Expenses/Savings)
- [ ] **Deliverable**: Dashboard shows real calculated KPIs and breakdowns for selected period

### Session 5: Dashboard — Charts
**Goal**: Complete dashboard with donut charts and monthly bar chart.
- [ ] DonutChart component (Recharts PieChart, Nord palette colors)
- [ ] Three donut charts: Income categories, Expenses categories, Savings categories
- [ ] MonthlyBarChart component (Recharts BarChart, grouped bars)
- [ ] Chart tooltips with formatted currency values
- [ ] Responsive chart sizing (stack on mobile)
- [ ] "Full Year" view for bar chart showing all 12 months
- [ ] **Deliverable**: Fully functional dashboard matching Excel spreadsheet layout

### Session 6: Tracking — Transaction Table
**Goal**: Full transaction ledger with sorting and filtering.
- [ ] TransactionTable component (sortable columns)
- [ ] Column rendering: Date, Type, Category, Amount (€ formatted), Details, Effective Date
- [ ] Sort by any column (click header to toggle asc/desc)
- [ ] Filter controls: Type dropdown, Category dropdown (filtered by type), Date range
- [ ] Running balance column (cumulative calculation)
- [ ] Header KPI cards (date of last entry, total entries, running balance)
- [ ] Pagination or virtual scroll for large datasets
- [ ] **Deliverable**: Browsable, sortable, filterable transaction history

### Session 7: Tracking — Add / Edit / Delete
**Goal**: Full CRUD operations on transactions from the UI.
- [ ] AddEntryForm component (modal or slide-in panel)
- [ ] Form fields: Date, Type, Category (dynamic dropdown filtered by type), Amount, Details
- [ ] Effective date auto-calculation based on settings
- [ ] Form validation (required fields, positive amounts, valid dates)
- [ ] Edit mode: click row to open pre-filled form, save updates
- [ ] Delete with confirmation modal
- [ ] Success/error toast notifications
- [ ] **Deliverable**: Users can manually add, edit, and delete transactions

### Session 8: Import — CSV Parsing + Preview
**Goal**: Upload bank CSV, parse in browser, preview before saving.
- [ ] ImportUpload component (drag-and-drop or file picker)
- [ ] Papa Parse integration: read CSV, detect columns, parse rows
- [ ] Column mapping UI: map CSV columns to transaction fields (date, amount, description)
- [ ] Hash generation: SHA-256(date + amount + description) for each row
- [ ] Duplicate detection: check hashes against existing transactions
- [ ] PreviewTable component: show parsed rows with suggested types/categories
- [ ] Status indicators: new (green), duplicate (yellow), unmatched (orange)
- [ ] Confirm button: save non-duplicate rows to IndexedDB
- [ ] **Deliverable**: User can upload CSV and import transactions with dedup protection

### Session 9: Import — Keyword Engine + Manager
**Goal**: Auto-categorization of imported transactions via keyword matching.
- [ ] Keyword matching engine: scan description field, match against keyword DB
- [ ] Case-insensitive, partial match support
- [ ] Auto-assign type + category when keyword matches
- [ ] KeywordManager component: table of all keyword → category mappings
- [ ] Add new keyword mapping form
- [ ] Edit/delete existing mappings
- [ ] Test widget: paste a description, see which category it would match
- [ ] Wire keyword engine into import preview (auto-fill categories)
- [ ] **Deliverable**: Smart import with auto-categorization, manageable keyword dictionary

### Session 10: Settings + Category Management
**Goal**: Full settings page with category CRUD and app configuration.
- [ ] CategoryEditor component: add, rename, reorder, delete categories per type
- [ ] Drag-and-drop reordering (or up/down buttons for simplicity)
- [ ] Prevent deletion of categories with existing transactions (warn + reassign)
- [ ] Settings form: late income shift toggle + day threshold
- [ ] Savings rate calculation method selector
- [ ] Data management section: Export all data as JSON, Import backup JSON
- [ ] Clear all data with double-confirmation
- [ ] **Deliverable**: Users can fully customize categories and app behavior

### Session 11: Supabase Integration + Sync
**Goal**: Cloud persistence with cross-device sync.
- [ ] Supabase project setup (free tier)
- [ ] Database tables mirroring Dexie schema (transactions, categories, keywords, settings)
- [ ] Row-level security policies (user can only access own data)
- [ ] Supabase Auth integration (email/password login)
- [ ] Login/logout UI
- [ ] Sync service: push local changes → Supabase, pull remote → IndexedDB
- [ ] Manual "Sync" button with last-sync timestamp display
- [ ] Conflict resolution: last-write-wins with timestamp comparison
- [ ] **Deliverable**: Data persists in cloud, accessible from any device after sync

### Session 12: Mobile Polish + Final QA
**Goal**: Production-ready app, fully tested on mobile.
- [ ] Mobile navigation refinements (bottom tab bar, touch targets)
- [ ] Table responsiveness (horizontal scroll or card view on small screens)
- [ ] Form usability on mobile (input sizing, keyboard handling)
- [ ] Chart touch interactions (tap for tooltips)
- [ ] Loading states and skeleton screens
- [ ] Error boundaries and fallback UI
- [ ] Empty state designs (no data yet screens)
- [ ] Final visual QA against kuba-brand-guidelines
- [ ] **Deliverable**: Production-ready, mobile-friendly finance tracker

---

## File Structure
```
finance-dashboard/
  public/
  src/
    components/
      layout/          — AppShell, Navbar, ThemeToggle
      dashboard/       — KPICard, BreakdownTable, DonutChart, MonthlyBarChart
      tracking/        — TransactionTable, AddEntryForm, EditModal
      import/          — ImportUpload, PreviewTable, KeywordManager
      settings/        — SettingsForm, DataManagement, CategoryEditor
      shared/          — Button, Card, Select, DatePicker, Modal, FilterBar, Toast
    hooks/
      useTransactions.js
      useCategories.js
      useSettings.js
      useFilters.js
      useSync.js
    db/
      index.js         — Dexie instance + schema
      seed.js          — Sample data loader (dev only)
      supabase.js      — Supabase client + sync logic
    utils/
      calculations.js  — Savings rate, balances, aggregations
      dateUtils.js     — Effective date logic, period helpers
      formatters.js    — Currency, percentages, date display
      hash.js          — SHA-256 hash generation for dedup
      csvParser.js     — Papa Parse wrapper + column mapping
      keywordEngine.js — Description → category matching
    styles/
      theme.css        — Nord CSS variables (dark + light)
      global.css       — Base styles, fonts, resets
    App.jsx
    main.jsx
  scripts/             — Python CSV parsers (optional, power-user)
  .github/
    workflows/
      deploy.yml       — GitHub Actions build + deploy
  index.html
  vite.config.js
  package.json
  CLAUDE.md            — This file
```

---

## Coding Conventions

- **Components**: Functional components with hooks. No class components.
- **State**: React state + Dexie.js. No Redux or external state library unless complexity demands it.
- **Naming**: PascalCase for components, camelCase for functions/variables, kebab-case for CSS files.
- **Formatting**: Prettier defaults. 2-space indent.
- **Amounts**: Income is always stored positive. Expenses and Savings are normally positive, but may be negative to represent a reimbursement/refund against that same category (e.g. you pay €100 for dinner, a friend pays you back €80 — log a second Expenses/Dinner entry of -€80, giving a net €20 cost, instead of recording the refund as Income). Category aggregation, running balance, and savings rate all net out correctly with this convention. Donut charts filter out categories whose net total is ≤ 0, since a negative slice can't be drawn.
- **Dates**: ISO strings (`YYYY-MM-DD`) in storage. Formatted for display via `dateUtils.js`.
- **Currency**: No currency symbol stored. Display formatting adds `€` (EUR). Configurable later if multi-currency needed.
- **No real data in commits**: Sample data files are clearly marked. `.gitignore` covers output folders.

---

## Sample Data Contract

All development uses this fixture data. Categories and amounts are realistic but fictional.

- **3 income sources**: Employment (Net), Side Hustle (Net), Dividends
- **9 expense categories**: Housing, Utilities, Groceries, Transportation, Fun & Vacations, Clothing, Body Care & Medicine, Media, Insurances
- **3 savings categories**: Emergency Fund, Retirement Account, Stock Portfolio
- **Date range**: Jan 2024 – Mar 2024 (enough to test multi-month views)
- **~60 transactions** covering all categories and types

---

## Future Improvements

Ideas captured for later, not yet built:

- **Trip/tag grouping**: Kuba prefixes related transaction descriptions with a shared tag during import (e.g. "Málaga - Jantar", "Málaga - Bebidas") specifically so they can later be grouped and summed to see total spend on a given trip/event. Needs a way to search/filter transactions by a description prefix and show a running total — not built yet, but the description field is already editable during CSV import preview to support tagging now.

---

## Security Notes

- No `.env` files with secrets — there are none (Supabase anon key is safe for frontend).
- Raw bank CSV files are never transmitted — parsed entirely in browser.
- Supabase RLS ensures only authenticated user can access their data.
- No analytics or tracking scripts.
- Python scripts run locally — no data sent anywhere.
- GitHub Pages serves static files only — no server-side code.
- Export/import uses local file system — no cloud storage beyond Supabase.
