begin;

-- 1. Update workflow_guard on work_orders: remove quality_check requirement and allow finishing -> ready
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
  if new.status='delivered' and(new.proof_media_id is null or new.confirmed_at is null) then raise exception 'Proof and confirmation time required';end if;
 when 'bom_versions' then if old.status='published' then raise exception 'Published BOM version is immutable; create a new version';end if;
 when 'purchases' then if new.status<>'draft' or new.total_minor<>0 then raise exception 'Purchases must begin as draft';end if;
 when 'purchase_items' then if exists(select 1 from public.purchases where id=new.purchase_id and status<>'draft') then raise exception 'Posted purchase items are immutable';end if;
 when 'quotations' then if new.status<>'draft' then raise exception 'Quotations must begin as draft';end if;
 when 'expenses' then if new.status<>'draft' then raise exception 'Expenses must begin as draft';end if;
 else null;
 end case;
 return new;end$function$;

-- 2. Update transition_order: remove quality_checks requirement for order READY status
create or replace function public.transition_order(target uuid, next_status text, expected_version integer, note text default ''::text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$declare item public.orders;states text[];idx integer;begin
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
 if next_status='COMPLETED' and not exists(select 1 from public.installations i join public.deliveries d on d.id=i.delivery_id where d.order_id=target and d.status='delivered' and i.status='completed' and i.customer_confirmed) then raise exception 'Delivery and installation sign-off required';end if;
 update public.orders set status=next_status,version=version+1 where id=target;insert into public.order_status_history(order_id,from_status,to_status,note) values(target,item.status,next_status,note);end$function$;

commit;
