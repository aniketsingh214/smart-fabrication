begin;
alter table public.owner_withdrawals add column idempotency_key uuid not null default gen_random_uuid() unique;
create or replace function public.record_withdrawal(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$declare result uuid;key uuid;existing public.owner_withdrawals;begin
 if not public.has_permission('finance.approve') then raise insufficient_privilege;end if;key=(payload->>'idempotency_key')::uuid;if key is null then raise exception 'Idempotency key required';end if;
 perform pg_advisory_xact_lock(hashtextextended('withdrawal:'||key::text,0));select * into existing from public.owner_withdrawals where idempotency_key=key;
 if found then
 if existing.created_by is distinct from auth.uid() or existing.name is distinct from payload->>'name' or existing.amount_minor is distinct from(payload->>'amount_minor')::bigint or existing.withdrawal_date is distinct from(payload->>'withdrawal_date')::date or existing.mode is distinct from payload->>'mode' or existing.reason is distinct from payload->>'reason' then raise exception 'Idempotency key conflict';end if;return existing.id;
 end if;
 insert into public.owner_withdrawals(name,amount_minor,withdrawal_date,mode,reason,idempotency_key) values(payload->>'name',(payload->>'amount_minor')::bigint,(payload->>'withdrawal_date')::date,payload->>'mode',payload->>'reason',key) returning id into result;return result;end$$;
commit;
