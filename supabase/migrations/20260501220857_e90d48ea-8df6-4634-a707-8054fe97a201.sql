
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  country text,
  preferred_currency text not null default 'USD',
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Transactions
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,           -- 'send' | 'receive' | 'swap' | 'payment' | 'trade'
  asset text not null,
  amount numeric not null,
  usd_value numeric not null default 0,
  status text not null default 'completed',
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.transactions enable row level security;
create policy "tx_select_own" on public.transactions for select using (auth.uid() = user_id);
create policy "tx_insert_own" on public.transactions for insert with check (auth.uid() = user_id);
create policy "tx_update_own" on public.transactions for update using (auth.uid() = user_id);
create policy "tx_delete_own" on public.transactions for delete using (auth.uid() = user_id);
create index transactions_user_created_idx on public.transactions(user_id, created_at desc);

-- Trades
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  side text not null,           -- 'buy' | 'sell'
  amount numeric not null,
  entry_price numeric not null,
  exit_price numeric,
  pnl numeric not null default 0,
  status text not null default 'open',
  confidence numeric,
  signal_id text,
  created_at timestamptz not null default now()
);
alter table public.trades enable row level security;
create policy "trades_select_own" on public.trades for select using (auth.uid() = user_id);
create policy "trades_insert_own" on public.trades for insert with check (auth.uid() = user_id);
create policy "trades_update_own" on public.trades for update using (auth.uid() = user_id);
create policy "trades_delete_own" on public.trades for delete using (auth.uid() = user_id);
create index trades_user_created_idx on public.trades(user_id, created_at desc);

-- Notification preferences
create table public.notification_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_alerts boolean not null default true,
  push_alerts boolean not null default false,
  trade_signals boolean not null default true,
  payment_updates boolean not null default true,
  security_alerts boolean not null default true,
  weekly_summary boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.notification_prefs enable row level security;
create policy "np_select_own" on public.notification_prefs for select using (auth.uid() = user_id);
create policy "np_insert_own" on public.notification_prefs for insert with check (auth.uid() = user_id);
create policy "np_update_own" on public.notification_prefs for update using (auth.uid() = user_id);

-- User API keys (3rd-party). Stored encrypted client-side via WebCrypto using user-derived key.
create table public.user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  provider text not null,        -- e.g. 'binance', 'coinbase', 'kraken'
  encrypted_key text not null,   -- base64 ciphertext
  encrypted_secret text,         -- base64 ciphertext
  iv text not null,              -- base64 IV
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.user_api_keys enable row level security;
create policy "ak_select_own" on public.user_api_keys for select using (auth.uid() = user_id);
create policy "ak_insert_own" on public.user_api_keys for insert with check (auth.uid() = user_id);
create policy "ak_update_own" on public.user_api_keys for update using (auth.uid() = user_id);
create policy "ak_delete_own" on public.user_api_keys for delete using (auth.uid() = user_id);

-- Profile auto-create trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  insert into public.notification_prefs (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger np_touch before update on public.notification_prefs
  for each row execute function public.touch_updated_at();
