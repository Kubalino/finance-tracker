-- Finance Tracker — Supabase schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Mirrors the local Dexie schema. Every table is scoped to auth.uid() via RLS,
-- so each user only ever sees their own rows.

create table if not exists public.transactions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  hash text,
  date date not null,
  effective_date date not null,
  type text not null check (type in ('Income', 'Expenses', 'Savings')),
  category text not null,
  -- Income must be non-negative; Expenses/Savings may be negative to
  -- represent a reimbursement or refund against that same category.
  amount numeric not null check (type <> 'Income' or amount >= 0),
  details text,
  source text not null default 'manual',
  import_batch uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('Income', 'Expenses', 'Savings')),
  name text not null,
  "order" integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.keywords (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  keyword text not null,
  type text not null check (type in ('Income', 'Expenses', 'Savings')),
  category text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id text not null default 'app',
  user_id uuid not null references auth.users (id) on delete cascade,
  late_income_shift boolean not null default true,
  late_income_start_day integer not null default 20,
  savings_rate_calc text not null default 'allocated',
  theme text not null default 'dark',
  updated_at timestamptz not null default now(),
  primary key (user_id)
);

create table if not exists public.tombstones (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  table_name text not null,
  deleted_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_updated_at_idx on public.transactions (updated_at);
create index if not exists categories_user_id_idx on public.categories (user_id);
create index if not exists keywords_user_id_idx on public.keywords (user_id);
create index if not exists tombstones_user_id_idx on public.tombstones (user_id);
create index if not exists tombstones_deleted_at_idx on public.tombstones (deleted_at);

alter table public.transactions enable row level security;
alter table public.categories enable row level security;
alter table public.keywords enable row level security;
alter table public.settings enable row level security;
alter table public.tombstones enable row level security;

create policy "Users manage their own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own categories" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own keywords" on public.keywords
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own settings" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own tombstones" on public.tombstones
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- RLS policies only filter rows; Postgres also requires explicit table-level
-- grants for the authenticated role, which the SQL Editor doesn't set up
-- automatically the way the Table Editor UI does.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.keywords to authenticated;
grant select, insert, update, delete on public.settings to authenticated;
grant select, insert, update, delete on public.tombstones to authenticated;
