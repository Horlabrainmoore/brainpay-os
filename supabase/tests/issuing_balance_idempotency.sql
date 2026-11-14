-- Run against a disposable database after migrations, with auth.uid() backed by JWT claims.
begin;
insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002');
insert into public.user_balances (user_id, usd_available) select id, 100 from auth.users
where id in ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
do $$
declare
  first_result public.user_balances;
  replay public.user_balances;
begin
  first_result := public.fund_issuing_balance(10, '10000000-0000-0000-0000-000000000001');
  perform public.fund_issuing_balance(20, '10000000-0000-0000-0000-000000000002');
  replay := public.fund_issuing_balance(10, '10000000-0000-0000-0000-000000000001');
  assert first_result = replay, 'replay must return original snapshot';
  assert (select usd_available = 70 and usd_issuing = 30 from public.user_balances where user_id = auth.uid());
  assert (select count(*) = 2 from public.balance_transfers where user_id = auth.uid());
  begin
    perform public.fund_issuing_balance(11, '10000000-0000-0000-0000-000000000001');
    raise exception 'expected amount mismatch';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.fund_issuing_balance(1, null);
    raise exception 'expected missing operation ID failure';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.fund_issuing_balance(0, '10000000-0000-0000-0000-000000000003');
    raise exception 'expected invalid amount';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.fund_issuing_balance(200, '10000000-0000-0000-0000-000000000003');
    raise exception 'expected insufficient funds';
  exception when raise_exception then
    if sqlerrm <> 'insufficient USD available balance' then raise; end if;
  end;
  assert (select count(*) = 2 from public.balance_transfers where user_id = auth.uid());
  assert not has_function_privilege('anon', 'public.fund_issuing_balance(numeric,uuid)', 'execute');
  assert has_function_privilege('authenticated', 'public.fund_issuing_balance(numeric,uuid)', 'execute');
  assert to_regprocedure('public.fund_issuing_balance(numeric)') is null;
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
do $$
begin
  perform public.fund_issuing_balance(10, '10000000-0000-0000-0000-000000000001');
  assert (select usd_available = 90 from public.user_balances where user_id = auth.uid()), 'IDs are scoped per user';
end $$;
select set_config('request.jwt.claim.sub', '', true);
do $$
begin
  begin
    perform public.fund_issuing_balance(10, '10000000-0000-0000-0000-000000000001');
    raise exception 'expected authentication failure';
  exception when invalid_authorization_specification then null;
  end;
end $$;
rollback;
