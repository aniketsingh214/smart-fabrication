begin;

-- 1. Add missing delivery sign-off columns to deliveries
alter table public.deliveries 
  add column if not exists delivered_by text,
  add column if not exists customer_signature text,
  add column if not exists remarks text;

-- 2. Add direct order association and sign-off columns to installations
alter table public.installations 
  add column if not exists order_id uuid references public.orders(id),
  add column if not exists installed_by text,
  add column if not exists completed_at timestamptz,
  add column if not exists customer_signature text,
  add column if not exists remarks text,
  add column if not exists photos jsonb default '[]'::jsonb;

-- Backfill order_id on existing installations from deliveries
update public.installations i
set order_id = d.order_id
from public.deliveries d
where i.delivery_id = d.id and i.order_id is null;

-- 3. Add installment metadata to customer_payments
alter table public.customer_payments 
  add column if not exists installment_number integer,
  add column if not exists due_date date,
  add column if not exists received_by text,
  add column if not exists notes text;

-- 3b. Update post_payment to store installment details
create or replace function public.post_payment(payment_kind text,payload jsonb)
returns uuid
language plpgsql
security definer
set search_path=''
as $$declare
  result uuid;
  amount bigint;
  total bigint;
  paid bigint;
  target uuid;
  table_name text;
  field_name text;
  existing record;
  key uuid;
  inst_num integer;
  due_d date;
  rec_by text;
  p_notes text;
begin
 if not public.has_permission('finance.write') then raise insufficient_privilege;end if;
 amount=(payload->>'amount_minor')::bigint;if amount<=0 then raise exception 'Positive payment required';end if;
 key=(payload->>'idempotency_key')::uuid;if key is null then raise exception 'Idempotency key required';end if;
 if payment_kind='customer' then table_name='customer_payments';field_name='order_id';
 elsif payment_kind='supplier' then table_name='supplier_payments';field_name='purchase_id';
 elsif payment_kind='labour' then table_name='labour_payments';field_name='worker_id';
 else raise exception 'Invalid payment kind';end if;
 target=(payload->>field_name)::uuid;
 perform pg_advisory_xact_lock(hashtextextended(target::text,0));
 execute format('select id,%I as target,amount_minor,mode,reference from public.%I where idempotency_key=$1',field_name,table_name) into existing using key;
 if existing.id is not null then
   if existing.target is distinct from target or existing.amount_minor is distinct from amount or existing.mode is distinct from payload->>'mode' or existing.reference is distinct from payload->>'reference' then raise exception 'Idempotency key conflict';end if;
   return existing.id;
 end if;
 if payment_kind='customer' then select total_minor into total from public.orders where id=target and status<>'CANCELLED' for update;
 elsif payment_kind='supplier' then select total_minor into total from public.purchases where id=target and status='received' for update;total=total-coalesce((select sum(r.amount_minor) from public.purchase_returns r join public.purchase_items i on i.id=r.purchase_item_id where i.purchase_id=target),0);
 else perform 1 from public.workers where id=target for update;if not found then raise no_data_found;end if;select coalesce(sum(amount_minor),0) into total from public.work_entries where worker_id=target;total=total-coalesce((select sum(amount_minor) from public.financial_adjustments where worker_id=target and kind='work_entry_reversal'),0);end if;
 if total is null then raise exception 'Payment target not found or not posted';end if;
 paid=public.finance_net_paid(payment_kind,target);
 if paid+amount>total then raise exception 'Payment exceeds outstanding balance';end if;

 if payment_kind='customer' then
   inst_num := (payload->>'installment_number')::integer;
   if inst_num is null then
     select coalesce(count(*), 0) + 1 into inst_num from public.customer_payments where order_id = target;
   end if;
   if (payload->>'due_date') is not null and (payload->>'due_date') <> '' then
     due_d := (payload->>'due_date')::date;
   end if;
   rec_by := nullif(trim(payload->>'received_by'), '');
   p_notes := nullif(trim(payload->>'notes'), '');
   insert into public.customer_payments(order_id, amount_minor, mode, reference, idempotency_key, installment_number, due_date, received_by, notes)
   values(target, amount, payload->>'mode', payload->>'reference', key, inst_num, due_d, rec_by, p_notes)
   returning id into result;
 else
   execute format('insert into public.%I(%I,amount_minor,mode,reference,idempotency_key) values($1,$2,$3,$4,$5) returning id',table_name,field_name) into result using target,amount,payload->>'mode',payload->>'reference',key;
 end if;
 return result;
end$$;

-- 4. Update workflow_guard:
-- - Deliveries: require confirmed_at when status='delivered'
-- - Installations: require customer_confirmed when status='completed'
create or replace function public.workflow_guard()
returns trigger
language plpgsql
set search_path to ''
as $function$begin
 case TG_TABLE_NAME
 when 'customers' then
  if TG_OP='UPDATE' then if old.user_id is distinct from new.user_id and not public.has_permission('users.write') then raise exception 'Identity linking requires owner';end if;end if;
 when 'work_orders' then
  if TG_OP='INSERT' then if new.status<>'pending' then raise exception 'Work orders must begin as pending';end if;
  elsif old.status is distinct from new.status then
   if not ((old.status='pending' and new.status='fabrication')or(old.status='fabrication' and new.status='finishing')or(old.status='finishing' and new.status='ready')or(old.status='quality_check' and new.status='ready')) then raise exception 'Invalid production stage';end if;
  end if;
 when 'deliveries' then
  if TG_OP='INSERT' then if new.status<>'scheduled' then raise exception 'Deliveries must begin as scheduled';end if;
  elsif old.status is distinct from new.status and not((old.status='scheduled' and new.status='dispatched')or(old.status='dispatched' and new.status='delivered')) then raise exception 'Invalid delivery transition';end if;
  if new.status='delivered' and new.confirmed_at is null then raise exception 'Customer delivery sign-off is required before completing delivery.';end if;
 when 'installations' then
  if new.status='completed' and not new.customer_confirmed then raise exception 'Customer installation sign-off is required before completing installation.';end if;
 when 'bom_versions' then if old.status='published' then raise exception 'Published BOM version is immutable; create a new version';end if;
 when 'purchases' then if new.status<>'draft' or new.total_minor<>0 then raise exception 'Purchases must begin as draft';end if;
 when 'purchase_items' then if exists(select 1 from public.purchases where id=new.purchase_id and status<>'draft') then raise exception 'Posted purchase items are immutable';end if;
 when 'quotations' then if new.status<>'draft' then raise exception 'Quotations must begin as draft';end if;
 when 'expenses' then if new.status<>'draft' then raise exception 'Expenses must begin as draft';end if;
 else null;
 end case;
 return new;end$function$;

-- 5. Update completion_evidence_guard to allow optional delivery proof photo while preserving verification if photo is attached
create or replace function public.completion_evidence_guard()
returns trigger
language plpgsql
set search_path to ''
as $function$begin
 if TG_TABLE_NAME='deliveries' then
  if new.status='delivered' and new.proof_media_id is not null and not exists(select 1 from public.media_assets where id=new.proof_media_id and context='delivery_proof' and visibility='private') then 
    raise exception 'Verified private delivery proof is required';
  end if;
 elsif TG_TABLE_NAME='installations' then
  if new.status='completed' then
   if not new.customer_confirmed then 
     raise exception 'Customer installation sign-off is required before completing installation.';
   end if;
   if new.delivery_id is not null and not exists(select 1 from public.deliveries where id=new.delivery_id and status='delivered') then 
     raise exception 'Delivery must be confirmed before installation completion';
   end if;
  end if;
 end if;return new;end$function$;

-- 6. Update transition_order with separate and distinct validation checks
create or replace function public.transition_order(target uuid, next_status text, expected_version integer, note text default ''::text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$declare item public.orders;states text[];idx integer;total_paid bigint;begin
 if not(public.has_permission('orders.write') or public.has_permission('production.write') or public.has_permission('delivery.write')) then raise insufficient_privilege;end if;
 select * into item from public.orders where id=target for update;if not found then raise no_data_found;end if;if item.version<>expected_version then raise exception 'Record changed; refresh and retry';end if;
 states=array['CONFIRMED','ADVANCE_RECEIVED','MEASUREMENT_CONFIRMED','PRODUCTION_PENDING','PRODUCTION_STARTED','FABRICATION_COMPLETED','FINISHING','READY','OUT_FOR_DELIVERY','INSTALLATION','COMPLETED'];idx=array_position(states,item.status);
 if next_status='CANCELLED' then
  if not public.has_permission('orders.approve') or item.status not in('CONFIRMED','ADVANCE_RECEIVED','MEASUREMENT_CONFIRMED','PRODUCTION_PENDING') then raise exception 'Order cancellation requires approval before production';end if;
  if public.finance_net_paid('customer',target)>0 then raise exception 'Recorded receipts require reviewed refund before cancellation';end if;
 elsif next_status in('ADVANCE_RECEIVED','MEASUREMENT_CONFIRMED','PRODUCTION_PENDING') then if not public.has_permission('orders.write') then raise insufficient_privilege;end if;
 elsif next_status in('PRODUCTION_STARTED','FABRICATION_COMPLETED','FINISHING','READY') then if not public.has_permission('production.write') then raise insufficient_privilege;end if;
 else if not public.has_permission('delivery.write') then raise insufficient_privilege;end if;end if;
 if next_status<>'CANCELLED' and states[idx+1] is distinct from next_status then raise exception 'Invalid order transition';end if;
 if next_status='ADVANCE_RECEIVED' and not exists(select 1 from public.customer_payments where order_id=target) then raise exception 'Record advance receipt first';end if;
 if next_status='MEASUREMENT_CONFIRMED' and not exists(select 1 from public.measurements m join public.quotations q on q.lead_id=m.lead_id join public.quotation_versions v on v.quotation_id=q.id where v.id=item.quotation_version_id) then raise exception 'Verified measurements required';end if;
 if next_status='READY' and (not exists(select 1 from public.work_orders where order_id=target) or exists(select 1 from public.work_orders w where w.order_id=target and w.status<>'ready')) then raise exception 'All work orders must be ready';end if;

 -- 7. Dispatch validation: 100% payment required before dispatch
 if next_status='OUT_FOR_DELIVERY' then
  total_paid := public.finance_net_paid('customer', target);
  if item.total_minor <= 0 or total_paid < item.total_minor then
   raise exception '100% payment is mandatory before dispatch. Outstanding balance must be ₹0. (डिस्पैच से पहले 100% भुगतान अनिवार्य है)';
  end if;
 end if;

 -- 8. Final completion validation: separate checks for Payment, Delivery Sign-off, and Installation Sign-off
 if next_status='COMPLETED' then
  total_paid := public.finance_net_paid('customer', target);
  
  -- Check 1: 100% Payment required
  if item.total_minor <= 0 or total_paid < item.total_minor then
   raise exception 'Order completion requires 100% payment. Outstanding balance is not zero. (ऑर्डर पूरा करने के लिए 100% भुगतान आवश्यक है)';
  end if;

  -- Check 2: Delivery Sign-off required
  if not exists(select 1 from public.deliveries d where d.order_id=target and d.status='delivered' and d.confirmed_at is not null) then
   raise exception 'Order completion requires Delivery Sign-off. Delivery is not completed yet. (डिलीवरी साइन-ऑफ पूरा होना आवश्यक है)';
  end if;

  -- Check 3: Installation Sign-off required
  if not exists(select 1 from public.installations i join public.deliveries d on d.id=i.delivery_id where d.order_id=target and i.status='completed' and i.customer_confirmed)
     and not exists(select 1 from public.installations i where i.order_id=target and i.status='completed' and i.customer_confirmed) then
   raise exception 'Order completion requires Installation Sign-off. Installation has not been signed off. (इंस्टॉलेशन साइन-ऑफ पूरा होना आवश्यक है)';
  end if;
 end if;

 update public.orders set status=next_status,version=version+1 where id=target;
 insert into public.order_status_history(order_id,from_status,to_status,note) values(target,item.status,next_status,note);
end$function$;

revoke execute on function public.transition_order(uuid,text,integer,text) from public,anon;
grant execute on function public.transition_order(uuid,text,integer,text) to authenticated;

commit;
