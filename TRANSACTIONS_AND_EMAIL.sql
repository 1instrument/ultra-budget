-- Run once in the Supabase SQL editor before deploying this feature.
create table if not exists public.transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  external_id text not null,
  account_id text,
  account_name text not null default 'Unknown',
  posted_at date not null,
  payee text not null default 'Unknown',
  amount numeric(14,2) not null,
  currency text not null default 'USD',
  category text,
  raw jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, provider, external_id)
);

create index if not exists transactions_user_posted_idx
  on public.transactions (user_id, posted_at desc);

alter table public.transactions enable row level security;

drop policy if exists "Users can read own transactions" on public.transactions;
create policy "Users can read own transactions" on public.transactions
  for select using (auth.uid() = user_id);

-- Writes happen only in server functions through the Supabase service role.
