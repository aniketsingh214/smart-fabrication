begin;
create table public.financial_adjustments(id uuid primary key default gen_random_uuid(),kind text not null check(kind in('customer_payment_reversal','supplier_payment_reversal','labour_payment_reversal','withdrawal_reversal','work_entry_reversal','supplier_refund','customer_refund')),source_id uuid not null,purchase_id uuid references public.purchases(id),order_id uuid references public.orders(id),worker_id uuid references public.workers(id),amount_minor bigint not null check(amount_minor>0),posting_date date not null,mode text not null check(mode in('cash','bank','upi','cheque')),reference text not null check(length(reference) between 1 and 200),reason text not null check(length(reason) between 3 and 500),idempotency_key uuid not null unique,created_by uuid not null references public.profiles(id),request jsonb not null,created_at timestamptz not null default now(),unique(kind,reference));
create unique index financial_source_once on public.financial_adjustments(kind,source_id) where kind<>'supplier_refund';
alter table public.financial_adjustments enable row level security;
create policy adjustment_read on public.financial_adjustments for select to authenticated using(public.has_permission('finance.read'));
revoke all on public.financial_adjustments from anon;
revoke insert,update,delete,truncate,references,trigger on public.financial_adjustments from authenticated;
grant select on public.financial_adjustments to authenticated;
create trigger adjustments_immutable before update or delete on public.financial_adjustments for each row execute function public.immutable_record();
create trigger adjustments_audit after insert on public.financial_adjustments for each row execute function public.audit_change();

-- Private helper: no client EXECUTE grant. Public reports check their own role scope.
create function public.finance_net_paid(payment_kind text,target uuid) returns numeric language sql stable security definer set search_path='' as $$
 select case payment_kind
 when 'supplier' then coalesce((select sum(amount_minor) from public.supplier_payments where purchase_id=target),0)-coalesce((select sum(amount_minor) from public.financial_adjustments where purchase_id=target and kind in('supplier_payment_reversal','supplier_refund')),0)
 when 'customer' then coalesce((select sum(amount_minor) from public.customer_payments where order_id=target),0)-coalesce((select sum(amount_minor) from public.financial_adjustments where order_id=target and kind in('customer_payment_reversal','customer_refund')),0)
 when 'labour' then coalesce((select sum(amount_minor) from public.labour_payments where worker_id=target),0)-coalesce((select sum(amount_minor) from public.financial_adjustments where worker_id=target and kind='labour_payment_reversal'),0) end
$$;
revoke execute on function public.finance_net_paid(text,uuid) from public,anon,authenticated;

create or replace function public.post_payment(payment_kind text,payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;amount bigint;total numeric;paid numeric;target uuid;table_name text;field_name text;existing record;key uuid;begin
 if not public.has_permission('finance.write') then raise insufficient_privilege;end if;amount=(payload->>'amount_minor')::bigint;key=(payload->>'idempotency_key')::uuid;
 if amount is null or amount<=0 or key is null then raise exception 'Positive payment and idempotency key required';end if;
 if payment_kind='customer' then table_name='customer_payments';field_name='order_id';elsif payment_kind='supplier' then table_name='supplier_payments';field_name='purchase_id';elsif payment_kind='labour' then table_name='labour_payments';field_name='worker_id';else raise exception 'Invalid payment kind';end if;
 target=(payload->>field_name)::uuid;perform pg_advisory_xact_lock(hashtextextended(key::text,0));
 execute format('select id,%I as target,amount_minor,mode,reference from public.%I where idempotency_key=$1',field_name,table_name) into existing using key;
 if existing.id is not null then if existing.target is distinct from target or existing.amount_minor is distinct from amount or existing.mode is distinct from payload->>'mode' or existing.reference is distinct from payload->>'reference' then raise exception 'Idempotency key conflict';end if;return existing.id;end if;
 if payment_kind='customer' then select total_minor into total from public.orders where id=target and status<>'CANCELLED' for update;
 elsif payment_kind='supplier' then select total_minor into total from public.purchases where id=target and status='received' for update;total=total-coalesce((select sum(r.amount_minor) from public.purchase_returns r join public.purchase_items i on i.id=r.purchase_item_id where i.purchase_id=target),0);
 else perform 1 from public.workers where id=target for update;if not found then raise no_data_found;end if;select coalesce(sum(amount_minor),0) into total from public.work_entries where worker_id=target;total=total-coalesce((select sum(amount_minor) from public.financial_adjustments where worker_id=target and kind='work_entry_reversal'),0);end if;
 if total is null then raise exception 'Payment target not found or not posted';end if;paid=public.finance_net_paid(payment_kind,target);
 if paid+amount>total then raise exception 'Payment exceeds outstanding balance';end if;
 execute format('insert into public.%I(%I,amount_minor,mode,reference,idempotency_key) values($1,$2,$3,$4,$5) returning id',table_name,field_name) into result using target,amount,payload->>'mode',payload->>'reference',key;return result;
end$$;

create or replace function public.receivable_balances() returns table(order_id uuid,name text,customer_id uuid,total_minor bigint,paid_minor numeric,outstanding_minor numeric) language sql stable security definer set search_path='' as $$select o.id,o.name,o.customer_id,case when o.status='CANCELLED' then 0 else o.total_minor end,public.finance_net_paid('customer',o.id),(case when o.status='CANCELLED' then 0 else o.total_minor end)-public.finance_net_paid('customer',o.id) from public.orders o where public.has_permission('finance.read') and public.has_permission('orders.read')$$;
create or replace function public.payable_balances() returns table(purchase_id uuid,name text,supplier_id uuid,total_minor bigint,returned_minor numeric,paid_minor numeric,outstanding_minor numeric) language sql stable security definer set search_path='' as $$select p.id,p.name,p.supplier_id,p.total_minor,coalesce(r.amount,0),public.finance_net_paid('supplier',p.id),p.total_minor-coalesce(r.amount,0)-public.finance_net_paid('supplier',p.id) from public.purchases p left join(select i.purchase_id,sum(r.amount_minor) amount from public.purchase_returns r join public.purchase_items i on i.id=r.purchase_item_id group by i.purchase_id)r on r.purchase_id=p.id where p.status='received' and public.has_permission('finance.read') and public.has_permission('purchases.read')$$;
create or replace function public.worker_balances() returns table(worker_id uuid,name text,earned_minor numeric,paid_minor numeric,outstanding_minor numeric) language sql stable security definer set search_path='' as $$select w.id,w.name,coalesce(e.amount,0)-coalesce(r.amount,0),public.finance_net_paid('labour',w.id),coalesce(e.amount,0)-coalesce(r.amount,0)-public.finance_net_paid('labour',w.id) from public.workers w left join(select worker_id,sum(amount_minor) amount from public.work_entries group by worker_id)e on e.worker_id=w.id left join(select worker_id,sum(amount_minor) amount from public.financial_adjustments where kind='work_entry_reversal' group by worker_id)r on r.worker_id=w.id where public.has_permission('workers.read') and public.has_permission('finance.read')$$;

-- Allow cancellation only once effective receipts (including explicitly recorded refunds) are zero.
do $$declare definition text;begin
 select pg_get_functiondef('public.transition_order(uuid,text,integer,text)'::regprocedure) into definition;
 definition=replace(definition,'if exists(select 1 from public.customer_payments where order_id=target) then','if public.finance_net_paid(''customer'',target)>0 then');
 if position('finance_net_paid' in definition)=0 then raise exception 'Cancellation upgrade did not match baseline';end if;execute definition;
end$$;

create function public.post_financial_adjustment(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare k text;source uuid;key uuid;target uuid;amount bigint;original_day date;posted date;prior public.financial_adjustments;result uuid;order_version integer;order_status text;position numeric;kind_payment text;begin
 if not public.has_permission('finance.approve') then raise insufficient_privilege;end if;
 k=payload->>'kind';source=(payload->>'source_id')::uuid;key=(payload->>'idempotency_key')::uuid;posted=(payload->>'posting_date')::date;
 if source is null or key is null or posted is null or posted>(now() at time zone 'Asia/Kolkata')::date or length(coalesce(payload->>'reason','')) not between 3 and 500 or length(coalesce(payload->>'reference','')) not between 1 and 200 or coalesce(payload->>'mode','') not in('cash','bank','upi','cheque') then raise exception 'Invalid financial correction';end if;
 if k<>'supplier_refund' and nullif(payload->>'amount_minor','') is not null then raise exception 'Correction amount is derived from source';end if;
 perform pg_advisory_xact_lock(hashtextextended(key::text,0));select * into prior from public.financial_adjustments where idempotency_key=key;
 if found then if prior.request is distinct from payload or prior.created_by is distinct from auth.uid() then raise exception 'Idempotency key conflict';end if;return prior.id;end if;
 if k='supplier_payment_reversal' then select purchase_id,amount_minor,(created_at at time zone 'Asia/Kolkata')::date into target,amount,original_day from public.supplier_payments where id=source;kind_payment='supplier';
 elsif k='customer_payment_reversal' then select order_id,amount_minor,(created_at at time zone 'Asia/Kolkata')::date into target,amount,original_day from public.customer_payments where id=source;kind_payment='customer';
 elsif k='labour_payment_reversal' then select worker_id,amount_minor,(created_at at time zone 'Asia/Kolkata')::date into target,amount,original_day from public.labour_payments where id=source;kind_payment='labour';
 elsif k='withdrawal_reversal' then select id,amount_minor,withdrawal_date into target,amount,original_day from public.owner_withdrawals where id=source for update;
 elsif k='work_entry_reversal' then select worker_id,amount_minor,(created_at at time zone 'Asia/Kolkata')::date into target,amount,original_day from public.work_entries where id=source;
 elsif k='supplier_refund' then target=source;amount=(payload->>'amount_minor')::bigint;kind_payment='supplier';select bill_date into original_day from public.purchases where id=target;
 elsif k='customer_refund' then target=source;kind_payment='customer';select (created_at at time zone 'Asia/Kolkata')::date into original_day from public.orders where id=target;
 else raise exception 'Unsupported correction kind';end if;
 if target is null or original_day is null or posted<original_day then raise exception 'Source not found or correction predates source';end if;
 if kind_payment='supplier' then perform 1 from public.purchases where id=target and status='received' for update;if not found then raise no_data_found;end if;
 elsif kind_payment='customer' then select status,version into order_status,order_version from public.orders where id=target for update;
 elsif kind_payment='labour' or k='work_entry_reversal' then perform 1 from public.workers where id=target for update;end if;
 if k='supplier_refund' then
  if payload->>'confirmed'<>'true' or payload->>'confirmed' is null then raise exception 'Confirm the actual supplier refund receipt';end if;
  select -(p.total_minor-coalesce((select sum(r.amount_minor) from public.purchase_returns r join public.purchase_items i on i.id=r.purchase_item_id where i.purchase_id=p.id),0)-public.finance_net_paid('supplier',p.id)) into position from public.purchases p where p.id=target;
  if amount is null or amount<=0 or amount>position then raise exception 'Refund exceeds supplier credit';end if;
 elsif k='customer_refund' then
  if not public.has_permission('orders.approve') then raise insufficient_privilege;end if;
  if payload->>'confirmed' is distinct from 'true' or order_status not in('CONFIRMED','ADVANCE_RECEIVED','MEASUREMENT_CONFIRMED','PRODUCTION_PENDING') then raise exception 'Refund cancellation is allowed only before production, with confirmed repayment';end if;
  amount=public.finance_net_paid('customer',target);if amount<=0 then raise exception 'No customer receipts remain to refund';end if;
 elsif kind_payment is not null then if public.finance_net_paid(kind_payment,target)<amount then raise exception 'Source amount has already been refunded or corrected';end if;
 elsif k='work_entry_reversal' then
  select coalesce(sum(amount_minor),0)-coalesce((select sum(amount_minor) from public.financial_adjustments where worker_id=target and kind='work_entry_reversal'),0)-public.finance_net_paid('labour',target) into position from public.work_entries where worker_id=target;
  if position<amount then raise exception 'Correct excess worker payments before reversing earned work';end if;
 end if;
 insert into public.financial_adjustments(kind,source_id,purchase_id,order_id,worker_id,amount_minor,posting_date,mode,reference,reason,idempotency_key,created_by,request)
 values(k,source,case when kind_payment='supplier' then target end,case when kind_payment='customer' then target end,case when kind_payment='labour' or k='work_entry_reversal' then target end,amount,posted,payload->>'mode',payload->>'reference',payload->>'reason',key,auth.uid(),payload) returning id into result;
 if k='customer_refund' then perform public.transition_order(target,'CANCELLED',order_version,payload->>'reason');end if;return result;
end$$;
revoke execute on function public.post_financial_adjustment(jsonb) from public;
grant execute on function public.post_financial_adjustment(jsonb) to authenticated;
commit;
