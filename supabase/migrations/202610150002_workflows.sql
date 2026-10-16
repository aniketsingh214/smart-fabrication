begin;
create function public.transition_lead(target uuid,next_status text,expected_version integer) returns void language plpgsql security definer set search_path='' as $$declare item public.leads;states text[];idx integer;begin
 if not public.has_permission('leads.write') then raise insufficient_privilege;end if;
 select * into item from public.leads where id=target for update;if not found then raise no_data_found;end if;if item.version<>expected_version then raise exception 'Record changed; refresh and retry';end if;
 states=array['NEW','CONTACTED','REQUIREMENT_CONFIRMED','MEASUREMENT_PENDING','MEASUREMENT_DONE','QUOTATION_SENT','NEGOTIATION','ORDER_CONFIRMED','PRODUCTION','COMPLETED'];idx=array_position(states,item.status);
 if not(next_status='LOST' and item.status<>'COMPLETED' or item.status='LOST' and next_status='CONTACTED' or states[idx+1]=next_status) then raise exception 'Invalid lead transition';end if;
 update public.leads set status=next_status,version=version+1,updated_at=now() where id=target;insert into public.lead_status_history(lead_id,from_status,to_status,actor_id) values(target,item.status,next_status,auth.uid());end$$;
create or replace function public.protect_business_updates() returns trigger language plpgsql set search_path='' as $$begin
 if TG_TABLE_NAME='quotations' and old.status<>new.status and current_user in('authenticated','anon') then raise exception 'Use quotation workflow';end if;
 if TG_TABLE_NAME='leads' and old.status<>new.status and current_user in('authenticated','anon') then raise exception 'Use lead transition function';end if;
 if TG_TABLE_NAME='purchases' and (old.status<>new.status or old.total_minor<>new.total_minor) and current_user in('authenticated','anon') then raise exception 'Use purchase workflow';end if;
 if TG_TABLE_NAME='purchase_items' and exists(select 1 from public.purchases where id=coalesce(new.purchase_id,old.purchase_id) and status<>'draft') then raise exception 'Posted purchase items are immutable';end if;
 if TG_TABLE_NAME='expenses' and old.status='approved' then raise exception 'Approved expenses are immutable';end if;
 if TG_TABLE_NAME='expenses' and old.status<>new.status and not public.has_permission('finance.approve') then raise insufficient_privilege;end if;
 if TG_TABLE_NAME='bom_items' and exists(select 1 from public.bom_versions where id=coalesce(new.bom_id,old.bom_id) and status='published') then raise exception 'Published BOM is immutable';end if;
 return new;end$$;

create function public.transition_order(target uuid,next_status text,expected_version integer,note text default '') returns void language plpgsql security definer set search_path='' as $$declare item public.orders;states text[];idx integer;begin
 if not(public.has_permission('orders.write') or public.has_permission('production.write') or public.has_permission('delivery.write')) then raise insufficient_privilege;end if;
 select * into item from public.orders where id=target for update;if not found then raise no_data_found;end if;if item.version<>expected_version then raise exception 'Record changed; refresh and retry';end if;
 states=array['CONFIRMED','ADVANCE_RECEIVED','MEASUREMENT_CONFIRMED','PRODUCTION_PENDING','PRODUCTION_STARTED','FABRICATION_COMPLETED','FINISHING','READY','OUT_FOR_DELIVERY','INSTALLATION','COMPLETED'];idx=array_position(states,item.status);
 if next_status='CANCELLED' then
  if not public.has_permission('orders.approve') or item.status not in('CONFIRMED','ADVANCE_RECEIVED','MEASUREMENT_CONFIRMED','PRODUCTION_PENDING') then raise exception 'Order cancellation requires approval before production';end if;
  if exists(select 1 from public.customer_payments where order_id=target) then raise exception 'Recorded receipts require reviewed refund before cancellation';end if;
 elsif next_status in('ADVANCE_RECEIVED','MEASUREMENT_CONFIRMED','PRODUCTION_PENDING') then if not public.has_permission('orders.write') then raise insufficient_privilege;end if;
 elsif next_status in('PRODUCTION_STARTED','FABRICATION_COMPLETED','FINISHING','READY') then if not public.has_permission('production.write') then raise insufficient_privilege;end if;
 else if not public.has_permission('delivery.write') then raise insufficient_privilege;end if;end if;
 if next_status<>'CANCELLED' and states[idx+1] is distinct from next_status then raise exception 'Invalid order transition';end if;
 if next_status='ADVANCE_RECEIVED' and not exists(select 1 from public.customer_payments where order_id=target) then raise exception 'Record advance receipt first';end if;
 if next_status='MEASUREMENT_CONFIRMED' and not exists(select 1 from public.measurements m join public.quotations q on q.lead_id=m.lead_id join public.quotation_versions v on v.quotation_id=q.id where v.id=item.quotation_version_id) then raise exception 'Verified measurements required';end if;
 if next_status='READY' and (not exists(select 1 from public.work_orders where order_id=target) or exists(select 1 from public.work_orders w where w.order_id=target and (w.status<>'ready' or not exists(select 1 from public.quality_checks qc where qc.work_order_id=w.id and qc.passed)))) then raise exception 'All work orders need passed quality checks';end if;
 if next_status='COMPLETED' and not exists(select 1 from public.installations i join public.deliveries d on d.id=i.delivery_id where d.order_id=target and d.status='delivered' and i.status='completed' and i.customer_confirmed) then raise exception 'Delivery and installation sign-off required';end if;
 update public.orders set status=next_status,version=version+1 where id=target;insert into public.order_status_history(order_id,from_status,to_status,note) values(target,item.status,next_status,note);end$$;

create function public.workflow_guard() returns trigger language plpgsql set search_path='' as $$begin
 if TG_TABLE_NAME='customers' and TG_OP='UPDATE' and old.user_id is distinct from new.user_id and not public.has_permission('users.write') then raise exception 'Identity linking requires owner';end if;
 if TG_TABLE_NAME='work_orders' and TG_OP='UPDATE' and old.status is distinct from new.status then
  if not ((old.status='pending' and new.status='fabrication') or(old.status='fabrication' and new.status='finishing') or(old.status='finishing' and new.status='quality_check') or(old.status='quality_check' and new.status='ready')) then raise exception 'Invalid production stage';end if;
  if new.status='ready' and not exists(select 1 from public.quality_checks where work_order_id=new.id and passed) then raise exception 'Passed quality check required';end if;
 end if;
 if TG_TABLE_NAME='deliveries' then
  if TG_OP='UPDATE' and old.status is distinct from new.status and not((old.status='scheduled' and new.status='dispatched')or(old.status='dispatched' and new.status='delivered')) then raise exception 'Invalid delivery transition';end if;
  if new.status='delivered' and (new.proof_media_id is null or new.confirmed_at is null) then raise exception 'Proof and confirmation time required';end if;
 end if;
 if TG_TABLE_NAME='bom_versions' and TG_OP='UPDATE' and old.status='published' then raise exception 'Published BOM version is immutable; create a new version';end if;
 if TG_TABLE_NAME='purchases' and TG_OP='INSERT' and(new.status<>'draft' or new.total_minor<>0) then raise exception 'Purchases must begin as draft';end if;
 if TG_TABLE_NAME='purchase_items' and TG_OP='INSERT' and exists(select 1 from public.purchases where id=new.purchase_id and status<>'draft') then raise exception 'Posted purchase items are immutable';end if;
 if TG_TABLE_NAME='quotations' and TG_OP='INSERT' and new.status<>'draft' then raise exception 'Quotations must begin as draft';end if;
 if TG_TABLE_NAME='expenses' and TG_OP='INSERT' and new.status<>'draft' then raise exception 'Expenses must begin as draft';end if;
 if TG_TABLE_NAME='work_orders' and TG_OP='INSERT' and new.status<>'pending' then raise exception 'Work orders must begin as pending';end if;
 if TG_TABLE_NAME='deliveries' and TG_OP='INSERT' and new.status<>'scheduled' then raise exception 'Deliveries must begin as scheduled';end if;
 return new;end$$;
create trigger guard_customer before update on public.customers for each row execute function public.workflow_guard();
create trigger guard_work_order before insert or update on public.work_orders for each row execute function public.workflow_guard();
create trigger guard_delivery before insert or update on public.deliveries for each row execute function public.workflow_guard();
create trigger guard_bom before update on public.bom_versions for each row execute function public.workflow_guard();
create trigger guard_purchase before insert on public.purchases for each row execute function public.workflow_guard();
create trigger guard_purchase_item before insert on public.purchase_items for each row execute function public.workflow_guard();
create trigger guard_quote before insert on public.quotations for each row execute function public.workflow_guard();
create trigger guard_expense before insert on public.expenses for each row execute function public.workflow_guard();
create function public.category_cycle_guard() returns trigger language plpgsql set search_path='' as $$begin
 if new.parent_id is not null and exists(with recursive parents as(select id,parent_id from public.categories where id=new.parent_id union all select c.id,c.parent_id from public.categories c join parents p on c.id=p.parent_id) select 1 from parents where id=new.id) then raise exception 'Category hierarchy cannot contain a cycle';end if;return new;end$$;
create trigger category_no_cycle before insert or update on public.categories for each row execute function public.category_cycle_guard();

create function public.inventory_balances() returns table(material_id uuid,name text,unit text,on_hand numeric,reserved numeric,available numeric,reorder_level numeric) language sql stable security invoker set search_path='' as $$select m.id,m.name,m.unit,coalesce(s.quantity,0),coalesce(r.quantity,0),coalesce(s.quantity,0)-coalesce(r.quantity,0),m.reorder_level from public.materials m left join(select material_id,sum(quantity) quantity from public.stock_movements group by material_id)s on s.material_id=m.id left join(select material_id,sum(quantity) quantity from public.stock_reservations where status='active' group by material_id)r on r.material_id=m.id where public.has_permission('inventory.read')$$;

create function public.finance_summary(start_at timestamptz,end_at timestamptz) returns jsonb language sql stable security invoker set search_path='' as $$select case when public.has_permission('finance.read') then jsonb_build_object(
 'currency','INR','policy','provisional_completed_order_accrual',
 'recognized_revenue_minor',coalesce((select sum(o.total_minor) from public.orders o join public.order_status_history h on h.order_id=o.id and h.to_status='COMPLETED' where o.status='COMPLETED' and h.created_at>=start_at and h.created_at<end_at),0),
 'consumed_material_minor',coalesce((select sum(round(-s.quantity*s.unit_cost_minor)) from public.stock_movements s where s.kind='consumption' and s.created_at>=start_at and s.created_at<end_at),0),
 'labour_earned_minor',coalesce((select sum(amount_minor) from public.work_entries where created_at>=start_at and created_at<end_at),0),
 'approved_expenses_minor',coalesce((select sum(amount_minor) from public.expenses where status='approved' and expense_date>=start_at::date and expense_date<end_at::date),0),
 'owner_withdrawals_minor',coalesce((select sum(amount_minor) from public.owner_withdrawals where withdrawal_date>=start_at::date and withdrawal_date<end_at::date),0),
 'customer_receipts_minor',coalesce((select sum(amount_minor) from public.customer_payments where created_at>=start_at and created_at<end_at),0)
 ) else null end$$;
grant execute on function public.transition_lead(uuid,text,integer),public.transition_order(uuid,text,integer,text),public.inventory_balances(),public.finance_summary(timestamptz,timestamptz) to authenticated;
revoke execute on function public.transition_lead(uuid,text,integer),public.transition_order(uuid,text,integer,text),public.inventory_balances(),public.finance_summary(timestamptz,timestamptz),public.workflow_guard(),public.category_cycle_guard() from public;
commit;
