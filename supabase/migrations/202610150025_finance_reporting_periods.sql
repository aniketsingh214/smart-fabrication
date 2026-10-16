begin;
create table public.finance_period_closures(id uuid primary key default gen_random_uuid(),closed_through date not null unique,reason text not null check(length(reason) between 3 and 500),idempotency_key uuid not null unique,created_by uuid not null references public.profiles(id),created_at timestamptz not null default now());
alter table public.finance_period_closures enable row level security;
create policy closure_read on public.finance_period_closures for select to authenticated using(public.has_permission('finance.read'));
revoke all on public.finance_period_closures from anon;
revoke insert,update,delete,truncate,references,trigger on public.finance_period_closures from authenticated;
grant select on public.finance_period_closures to authenticated;
create trigger closures_immutable before update or delete on public.finance_period_closures for each row execute function public.immutable_record();
create trigger closures_audit after insert on public.finance_period_closures for each row execute function public.audit_change();
create function public.close_finance_period(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare cutoff date;key uuid;prior public.finance_period_closures;result uuid;begin
 if not public.has_permission('finance.approve') then raise insufficient_privilege;end if;
 cutoff=(payload->>'closed_through')::date;key=(payload->>'idempotency_key')::uuid;
 if key is null or cutoff is null or cutoff>=(now() at time zone 'Asia/Kolkata')::date or length(coalesce(payload->>'reason','')) not between 3 and 500 or payload->>'confirmed' is distinct from 'true' then raise exception 'Confirm a reviewed past-period closure and give a reason';end if;
 perform pg_advisory_xact_lock(hashtextextended('smart-fabrication-finance-period',0));select * into prior from public.finance_period_closures where idempotency_key=key;
 if found then if prior.closed_through is distinct from cutoff or prior.reason is distinct from payload->>'reason' or prior.created_by is distinct from auth.uid() then raise exception 'Idempotency key conflict';end if;return prior.id;end if;
 if cutoff<=coalesce((select max(closed_through) from public.finance_period_closures),'-infinity'::date) then raise exception 'Closed-through date must advance the current closure';end if;
 insert into public.finance_period_closures(closed_through,reason,idempotency_key,created_by) values(cutoff,payload->>'reason',key,auth.uid()) returning id into result;return result;
end$$;
create function public.finance_posting_date_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare day date;begin
 if TG_TABLE_NAME='expenses' then if new.status<>'approved' then return new;end if;day=new.expense_date;
 elsif TG_TABLE_NAME='purchases' then if new.status<>'received' then return new;end if;day=new.bill_date;
 elsif TG_TABLE_NAME='owner_withdrawals' then day=new.withdrawal_date;
 elsif TG_TABLE_NAME='expense_reversals' then day=new.reversal_date;
 elsif TG_TABLE_NAME='financial_adjustments' then day=new.posting_date;
 else day=(new.created_at at time zone 'Asia/Kolkata')::date;end if;
 perform pg_advisory_xact_lock_shared(hashtextextended('smart-fabrication-finance-period',0));
 if day is null or day>(now() at time zone 'Asia/Kolkata')::date or day<=coalesce((select max(closed_through) from public.finance_period_closures),'-infinity'::date) then raise exception 'Posting date is future-dated or in a closed finance period';end if;
 return new;end$$;
do $$declare t text;begin
 foreach t in array array['expenses','purchases','owner_withdrawals','expense_reversals','financial_adjustments','customer_payments','supplier_payments','labour_payments','work_entries','purchase_returns','stock_movements'] loop
 execute format('create trigger finance_period_guard before insert or update on public.%I for each row execute function public.finance_posting_date_guard()',t);end loop;
end$$;

create or replace function public.finance_summary(start_at timestamptz,end_at timestamptz) returns jsonb language sql stable security invoker set search_path='' as $$
 with corrections as(select kind,coalesce(sum(amount_minor),0) amount from public.financial_adjustments where posting_date>=(start_at at time zone 'Asia/Kolkata')::date and posting_date<(end_at at time zone 'Asia/Kolkata')::date group by kind),
 gross as(select coalesce((select sum(amount_minor) from public.expenses where status='approved' and expense_date>=(start_at at time zone 'Asia/Kolkata')::date and expense_date<(end_at at time zone 'Asia/Kolkata')::date),0) expenses,coalesce((select sum(amount_minor) from public.expense_reversals where reversal_date>=(start_at at time zone 'Asia/Kolkata')::date and reversal_date<(end_at at time zone 'Asia/Kolkata')::date),0) reversed_expenses,coalesce((select sum(amount_minor) from public.customer_payments where created_at>=start_at and created_at<end_at),0) receipts)
 select case when public.has_permission('finance.read') then jsonb_build_object('currency','INR','policy','provisional_completed_order_accrual',
 'recognized_revenue_minor',coalesce((select sum(o.total_minor) from public.orders o join public.order_status_history h on h.order_id=o.id and h.to_status='COMPLETED' where o.status='COMPLETED' and h.created_at>=start_at and h.created_at<end_at),0),
 'consumed_material_minor',coalesce((select sum(-coalesce(book_value_minor,round(quantity*unit_cost_minor))) from public.stock_movements where kind='consumption' and created_at>=start_at and created_at<end_at),0),
 'labour_earned_minor',coalesce((select sum(amount_minor) from public.work_entries where created_at>=start_at and created_at<end_at),0)-coalesce((select amount from corrections where kind='work_entry_reversal'),0),
 'gross_approved_expenses_minor',(select expenses from gross),'reversed_expenses_minor',(select reversed_expenses from gross),'approved_expenses_minor',(select expenses-reversed_expenses from gross),
 'owner_withdrawals_minor',coalesce((select sum(amount_minor) from public.owner_withdrawals where withdrawal_date>=(start_at at time zone 'Asia/Kolkata')::date and withdrawal_date<(end_at at time zone 'Asia/Kolkata')::date),0)-coalesce((select amount from corrections where kind='withdrawal_reversal'),0),
 'gross_customer_receipts_minor',(select receipts from gross),'customer_refunds_minor',coalesce((select amount from corrections where kind='customer_refund'),0),
 'customer_receipts_minor',(select receipts from gross)-coalesce((select amount from corrections where kind='customer_payment_reversal'),0)-coalesce((select amount from corrections where kind='customer_refund'),0),
 'supplier_refunds_minor',coalesce((select amount from corrections where kind='supplier_refund'),0),'corrections_minor',coalesce((select sum(amount) from corrections),0)) else null end
$$;
do $$declare definition text;begin
 select pg_get_functiondef('public.supplier_statement(uuid,timestamptz,text,uuid,integer)'::regprocedure) into definition;
 definition=replace(definition,'after_kind in(''invoice'',''payment'',''return'')','after_kind is not null and after_kind in(''invoice'',''payment'',''return'',''supplier_refund'',''supplier_payment_reversal'')');
 definition=replace(definition,'union all select s.id,''payment'',s.created_at,s.reference,-s.amount_minor::numeric from public.supplier_payments s join posted p on p.id=s.purchase_id',
 'union all select s.id,''payment'',s.created_at,s.reference,-s.amount_minor::numeric from public.supplier_payments s join posted p on p.id=s.purchase_id union all select a.id,a.kind,a.created_at,a.reference,a.amount_minor::numeric from public.financial_adjustments a join posted p on p.id=a.purchase_id where a.kind in(''supplier_refund'',''supplier_payment_reversal'')');
 definition=replace(definition,'where kind=''payment''','where kind in(''payment'',''supplier_refund'',''supplier_payment_reversal'')');
 if position('public.financial_adjustments' in definition)=0 then raise exception 'Statement upgrade did not match baseline';end if;execute definition;
end$$;
create index on public.financial_adjustments(purchase_id,kind);
create index on public.financial_adjustments(order_id,kind);
create index on public.financial_adjustments(worker_id,kind);
create index on public.financial_adjustments(posting_date);
revoke execute on function public.close_finance_period(jsonb),public.finance_posting_date_guard() from public;
grant execute on function public.close_finance_period(jsonb) to authenticated;
commit;
