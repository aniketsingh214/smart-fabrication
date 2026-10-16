begin;
create table public.expense_reversals(id uuid primary key default gen_random_uuid(),expense_id uuid not null unique references public.expenses(id),amount_minor bigint not null check(amount_minor>0),reversal_date date not null,reason text not null check(length(reason) between 3 and 500),idempotency_key uuid not null unique,created_by uuid not null references public.profiles(id),created_at timestamptz not null default now());
alter table public.expense_reversals enable row level security;
create policy reversals_read on public.expense_reversals for select to authenticated using(public.has_permission('finance.read'));
grant select on public.expense_reversals to authenticated;
create trigger reversals_immutable before update or delete on public.expense_reversals for each row execute function public.immutable_record();
create trigger reversals_audit after insert on public.expense_reversals for each row execute function public.audit_change();
create function public.reverse_expense(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare original public.expenses;prior public.expense_reversals;result uuid;key uuid;posted_date date;note text;begin
 if not public.has_permission('finance.approve') then raise insufficient_privilege;end if;
 key=(payload->>'idempotency_key')::uuid;posted_date=(payload->>'reversal_date')::date;note=payload->>'reason';
 if key is null or posted_date is null or note is null or length(note) not between 3 and 500 then raise exception 'Reversal date, reason and idempotency key required';end if;
 perform pg_advisory_xact_lock(hashtextextended(key::text,0));select * into prior from public.expense_reversals where idempotency_key=key;
 if found then if prior.expense_id is distinct from(payload->>'expense_id')::uuid or prior.reversal_date is distinct from posted_date or prior.reason is distinct from note or prior.created_by is distinct from auth.uid() then raise exception 'Idempotency key conflict';end if;return prior.id;end if;
 select * into original from public.expenses where id=(payload->>'expense_id')::uuid for update;if not found then raise no_data_found;end if;
 if original.status<>'approved' then raise exception 'Only approved expenses can be reversed';end if;
 if posted_date<original.expense_date or posted_date>(now() at time zone 'Asia/Kolkata')::date then raise exception 'Reversal date must be between expense date and today';end if;
 if exists(select 1 from public.expense_reversals where expense_id=original.id) then raise exception 'Expense already reversed';end if;
 insert into public.expense_reversals(expense_id,amount_minor,reversal_date,reason,idempotency_key,created_by) values(original.id,original.amount_minor,posted_date,note,key,auth.uid()) returning id into result;return result;
end$$;
create or replace function public.finance_summary(start_at timestamptz,end_at timestamptz) returns jsonb language sql stable security invoker set search_path='' as $$
 with costs as(select coalesce(sum(amount_minor),0) gross from public.expenses where status='approved' and expense_date>=(start_at at time zone 'Asia/Kolkata')::date and expense_date<(end_at at time zone 'Asia/Kolkata')::date),reversed as(select coalesce(sum(amount_minor),0) amount from public.expense_reversals where reversal_date>=(start_at at time zone 'Asia/Kolkata')::date and reversal_date<(end_at at time zone 'Asia/Kolkata')::date)
 select case when public.has_permission('finance.read') then jsonb_build_object('currency','INR','policy','provisional_completed_order_accrual',
 'recognized_revenue_minor',coalesce((select sum(o.total_minor) from public.orders o join public.order_status_history h on h.order_id=o.id and h.to_status='COMPLETED' where o.status='COMPLETED' and h.created_at>=start_at and h.created_at<end_at),0),
 'consumed_material_minor',coalesce((select sum(round(-s.quantity*s.unit_cost_minor)) from public.stock_movements s where s.kind='consumption' and s.created_at>=start_at and s.created_at<end_at),0),
 'labour_earned_minor',coalesce((select sum(amount_minor) from public.work_entries where created_at>=start_at and created_at<end_at),0),
 'gross_approved_expenses_minor',(select gross from costs),'reversed_expenses_minor',(select amount from reversed),'approved_expenses_minor',(select gross from costs)-(select amount from reversed),
 'owner_withdrawals_minor',coalesce((select sum(amount_minor) from public.owner_withdrawals where withdrawal_date>=(start_at at time zone 'Asia/Kolkata')::date and withdrawal_date<(end_at at time zone 'Asia/Kolkata')::date),0),
 'customer_receipts_minor',coalesce((select sum(amount_minor) from public.customer_payments where created_at>=start_at and created_at<end_at),0)) else null end
$$;
revoke execute on function public.reverse_expense(jsonb) from public;
grant execute on function public.reverse_expense(jsonb) to authenticated;
commit;
