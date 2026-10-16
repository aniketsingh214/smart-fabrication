begin;
drop policy own_quotes on public.quotations;
create policy own_quotes on public.quotations for select to authenticated using(status<>'draft' and exists(select 1 from public.customers c where c.id=customer_id and c.user_id=auth.uid()));
drop policy own_quote_versions on public.quotation_versions;
create policy own_quote_versions on public.quotation_versions for select to authenticated using(exists(select 1 from public.quotations q join public.customers c on c.id=q.customer_id where q.id=quotation_id and q.status<>'draft' and c.user_id=auth.uid()));
drop policy staff_read on public.leads;
create policy staff_read on public.leads for select to authenticated using(public.has_permission('leads.read') and(assigned_to is null or assigned_to=auth.uid() or public.has_permission('users.read')));
drop policy staff_update on public.leads;
create policy staff_update on public.leads for update to authenticated using(public.has_permission('leads.write') and(assigned_to is null or assigned_to=auth.uid() or public.has_permission('users.read'))) with check(public.has_permission('leads.write'));
create function public.customer_identity_guard() returns trigger language plpgsql set search_path='' as $$begin
 if TG_OP='INSERT' and new.user_id is not null and not public.has_permission('users.write') then raise insufficient_privilege;end if;return new;end$$;
create trigger customer_identity_insert before insert on public.customers for each row execute function public.customer_identity_guard();
create function public.immutable_record() returns trigger language plpgsql set search_path='' as $$begin raise exception 'History is append-only; use a reviewed reversal';end$$;
do $$declare t text;begin for t in select unnest(array['material_rates','quotation_versions','stock_movements','customer_payments','supplier_payments','labour_payments','work_entries','owner_withdrawals','audit_logs','labour_rates']) loop execute format('create trigger immutable_history before update or delete on public.%I for each row execute function public.immutable_record()',t);end loop;end$$;
-- Customer and finance contact access remains RLS-scoped; avoid anonymous raw estimate snapshots.
revoke execute on function public.customer_identity_guard(),public.immutable_record() from public;
commit;
