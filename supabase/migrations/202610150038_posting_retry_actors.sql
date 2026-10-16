begin;
-- Existing rows remain unchanged. New postings record their authenticated author.
alter table public.supplier_payments add column created_by uuid references public.profiles(id);
alter table public.supplier_payments alter column created_by set default auth.uid();
alter table public.labour_payments add column created_by uuid references public.profiles(id);
alter table public.labour_payments alter column created_by set default auth.uid();
alter table public.work_entries add column created_by uuid references public.profiles(id);
alter table public.work_entries alter column created_by set default auth.uid();

create function public.retry_actor_matches(source_table text,source_id uuid,recorded_actor uuid) returns boolean language sql stable security definer set search_path='' as $$
 select case when source_table not in('customer_payments','supplier_payments','labour_payments','stock_movements','work_entries') or auth.uid() is null then false
 when recorded_actor is not null then recorded_actor=auth.uid()
 else (select count(*)=1 and bool_and(actor_id is not null and actor_id=auth.uid()) from public.audit_logs where entity_type=source_table and entity_id=source_id::text and action='INSERT') end
$$;
revoke execute on function public.retry_actor_matches(text,uuid,uuid) from public,anon,authenticated,service_role;
do $patch$
declare definition text;
begin
 select pg_get_functiondef('public.post_payment(text,jsonb)'::regprocedure) into definition;
 if position('amount_minor,mode,reference from public.%I' in definition)=0 or position('if existing.id is not null then if existing.target' in definition)=0 then raise exception 'Unexpected payment retry definition';end if;
 definition:=replace(definition,'amount_minor,mode,reference from public.%I','amount_minor,mode,reference,created_by from public.%I');
 definition:=replace(definition,'if existing.id is not null then if existing.target',$after$if existing.id is not null then if not public.retry_actor_matches(table_name,existing.id,existing.created_by) then raise exception 'Idempotency key belongs to another or unverifiable actor';end if;if existing.target$after$);
 execute definition;
 select pg_get_functiondef('public.post_stock(jsonb)'::regprocedure) into definition;
 if position('if found then if existing.material_id' in definition)=0 then raise exception 'Unexpected stock retry definition';end if;
 definition:=replace(definition,'if found then if existing.material_id',$after$if found then if not public.retry_actor_matches('stock_movements',existing.id,existing.created_by) then raise exception 'Idempotency key belongs to another or unverifiable actor';end if;if existing.material_id$after$);
 execute definition;
 select pg_get_functiondef('public.post_work_entry(jsonb)'::regprocedure) into definition;
 if position('if found then if existing.worker_id' in definition)=0 then raise exception 'Unexpected earning retry definition';end if;
 definition:=replace(definition,'if found then if existing.worker_id',$after$if found then if not public.retry_actor_matches('work_entries',existing.id,existing.created_by) then raise exception 'Idempotency key belongs to another or unverifiable actor';end if;if existing.worker_id$after$);
 execute definition;
end$patch$;
commit;
