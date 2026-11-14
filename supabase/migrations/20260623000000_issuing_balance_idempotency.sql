-- Legacy transfers have no operation ID; new RPC calls must supply one.
alter table public.balance_transfers
  add column operation_id uuid,
  add column result jsonb,
  add constraint balance_transfers_user_operation_key unique (user_id, operation_id);

-- Remove the unprotected overload so clients cannot bypass idempotency.
drop function public.fund_issuing_balance(numeric);

create function public.fund_issuing_balance(p_amount numeric, p_operation_id uuid)
returns public.user_balances
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_amount numeric(18,2) := round(p_amount, 2);
  v_row public.user_balances;
  v_transfer public.balance_transfers;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if v_amount is null or v_amount <= 0 then
    raise exception 'amount must be greater than zero' using errcode = '22023';
  end if;
  if p_operation_id is null then
    raise exception 'operation ID is required' using errcode = '22023';
  end if;

  insert into public.user_balances (user_id) values (v_user)
  on conflict (user_id) do nothing;

  -- Serialize transfers for this user before checking for an existing operation.
  perform 1 from public.user_balances where user_id = v_user for update;
  select * into v_transfer from public.balance_transfers
   where user_id = v_user and operation_id = p_operation_id;
  if found then
    if v_transfer.amount <> v_amount then
      raise exception 'operation ID already used with a different amount' using errcode = '22023';
    end if;
    return jsonb_populate_record(null::public.user_balances, v_transfer.result);
  end if;

  update public.user_balances
     set usd_available = usd_available - v_amount,
         usd_issuing = usd_issuing + v_amount,
         updated_at = now()
   where user_id = v_user and usd_available >= v_amount
  returning * into v_row;
  if not found then
    raise exception 'insufficient USD available balance';
  end if;

  insert into public.balance_transfers
    (user_id, from_balance, to_balance, amount, operation_id, result)
  values (v_user, 'usd_available', 'usd_issuing', v_amount, p_operation_id, to_jsonb(v_row));
  return v_row;
end;
$$;

revoke execute on function public.fund_issuing_balance(numeric, uuid) from public, anon;
grant execute on function public.fund_issuing_balance(numeric, uuid) to authenticated;
