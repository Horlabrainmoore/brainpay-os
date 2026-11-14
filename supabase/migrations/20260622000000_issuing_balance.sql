create table public.user_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  usd_available numeric(18,2) not null default 0 check (usd_available >= 0),
  usd_issuing numeric(18,2) not null default 0 check (usd_issuing >= 0),
  updated_at timestamptz not null default now()
);

alter table public.user_balances enable row level security;
create policy "ub_select_own" on public.user_balances for select using (auth.uid() = user_id);

create table public.balance_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_balance text not null,
  to_balance text not null,
  amount numeric(18,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

alter table public.balance_transfers enable row level security;
create policy "bt_select_own" on public.balance_transfers for select using (auth.uid() = user_id);

create or replace function public.fund_issuing_balance(p_amount numeric)
returns public.user_balances
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_amount numeric(18,2) := round(p_amount, 2);
  v_row public.user_balances;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if v_amount is null or v_amount <= 0 then
    raise exception 'amount must be greater than zero' using errcode = '22023';
  end if;

  insert into public.user_balances (user_id) values (v_user)
  on conflict (user_id) do nothing;

  update public.user_balances
     set usd_available = usd_available - v_amount,
         usd_issuing = usd_issuing + v_amount,
         updated_at = now()
   where user_id = v_user
     and usd_available >= v_amount
  returning * into v_row;

  if not found then
    raise exception 'insufficient USD available balance';
  end if;

  insert into public.balance_transfers (user_id, from_balance, to_balance, amount)
  values (v_user, 'usd_available', 'usd_issuing', v_amount);

  return v_row;
end;
$$;

revoke execute on function public.fund_issuing_balance(numeric) from public, anon;
grant execute on function public.fund_issuing_balance(numeric) to authenticated;
