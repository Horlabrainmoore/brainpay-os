-- Admin roles (separate table, never on profiles)
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create policy "Users can view own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

-- Issuing sandbox ledger
create table public.issuing_balances (
  user_id uuid primary key,
  available_usd numeric(18,2) not null default 0 check (available_usd >= 0),
  issuing_usd numeric(18,2) not null default 0 check (issuing_usd >= 0),
  updated_at timestamptz not null default now()
);

grant select on public.issuing_balances to authenticated;
grant all on public.issuing_balances to service_role;

alter table public.issuing_balances enable row level security;

create policy "Users can view own issuing balances"
  on public.issuing_balances for select to authenticated
  using (auth.uid() = user_id);

create table public.issuing_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount_usd numeric(18,2) not null check (amount_usd > 0),
  direction text not null default 'available_to_issuing',
  status text not null,
  reference text,
  note text,
  created_at timestamptz not null default now()
);

create index idx_issuing_transfers_user on public.issuing_transfers (user_id, created_at desc);

grant select on public.issuing_transfers to authenticated;
grant all on public.issuing_transfers to service_role;

alter table public.issuing_transfers enable row level security;

create policy "Users can view own issuing transfers"
  on public.issuing_transfers for select to authenticated
  using (auth.uid() = user_id);

-- Ledger mutation: security definer so clients can never write balances directly.
create or replace function public.perform_issuing_transfer(p_user_id uuid, p_amount numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available numeric;
begin
  if p_amount is null or p_amount <= 0 or p_amount > 1000000 then
    raise exception 'Invalid transfer amount';
  end if;
  if round(p_amount, 2) <> p_amount then
    raise exception 'Amount supports up to 2 decimal places';
  end if;

  select available_usd into v_available
  from public.issuing_balances
  where user_id = p_user_id
  for update;

  if v_available is null then
    raise exception 'No issuing balance account found for this user';
  end if;
  if v_available < p_amount then
    raise exception 'Insufficient available balance';
  end if;

  update public.issuing_balances
  set available_usd = available_usd - p_amount,
      issuing_usd = issuing_usd + p_amount,
      updated_at = now()
  where user_id = p_user_id;

  insert into public.issuing_transfers (user_id, amount_usd, direction, status, note)
  values (p_user_id, p_amount, 'available_to_issuing', 'completed', 'Sandbox transfer: Available to Issuing');
end;
$$;

revoke all on function public.perform_issuing_transfer from public, anon, authenticated;
grant execute on function public.perform_issuing_transfer to service_role;

-- Dedicated Telegram inbox bot
create table public.telegram_inbox_messages (
  update_id bigint primary key,
  chat_id bigint not null,
  sender_id bigint,
  sender_username text,
  sender_name text,
  text text,
  raw jsonb not null,
  created_at timestamptz not null default now()
);

create index idx_telegram_inbox_chat on public.telegram_inbox_messages (chat_id, update_id desc);

grant select on public.telegram_inbox_messages to authenticated;
grant all on public.telegram_inbox_messages to service_role;

alter table public.telegram_inbox_messages enable row level security;

create policy "Authenticated users can view the inbox"
  on public.telegram_inbox_messages for select to authenticated
  using (true);

create table public.telegram_sent_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id bigint not null,
  text text not null,
  telegram_message_id bigint,
  status text not null default 'sent',
  error text,
  created_by uuid,
  created_at timestamptz not null default now()
);

grant select on public.telegram_sent_messages to authenticated;
grant all on public.telegram_sent_messages to service_role;

alter table public.telegram_sent_messages enable row level security;

create policy "Authenticated users can view sent messages"
  on public.telegram_sent_messages for select to authenticated
  using (true);

create table public.telegram_reply_drafts (
  id uuid primary key default gen_random_uuid(),
  inbox_update_id bigint,
  draft_text text not null,
  rationale text,
  tone text,
  status text not null default 'suggested',
  model text,
  created_at timestamptz not null default now()
);

grant select, update on public.telegram_reply_drafts to authenticated;
grant all on public.telegram_reply_drafts to service_role;

alter table public.telegram_reply_drafts enable row level security;

create policy "Authenticated users can review drafts"
  on public.telegram_reply_drafts for select to authenticated
  using (true);

create policy "Authenticated users can update draft status"
  on public.telegram_reply_drafts for update to authenticated
  using (true);

-- Mobile wallet (WalletConnect) per-user configuration
create table public.walletconnect_settings (
  user_id uuid primary key,
  project_id text not null default '',
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.walletconnect_settings to authenticated;
grant all on public.walletconnect_settings to service_role;

alter table public.walletconnect_settings enable row level security;

create policy "Users manage own walletconnect settings"
  on public.walletconnect_settings for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
