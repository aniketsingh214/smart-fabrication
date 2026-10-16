begin;
-- A partial job consumption must keep the unused part reserved.
alter table public.stock_reservations add column consumed_quantity numeric not null default 0;
update public.stock_reservations set consumed_quantity=quantity where status='consumed';
alter table public.stock_reservations add constraint reservation_consumed_bounds check(consumed_quantity>=0 and consumed_quantity<=quantity);
drop policy lead_media_metadata on public.media_assets;
create policy lead_media_metadata on public.media_assets for select to authenticated using(exists(select 1 from public.lead_attachments a where a.media_id=media_assets.id and public.can_access_lead(a.lead_id)));
insert into public.role_permissions values('accounts','materials.read'),('accounts','production.read') on conflict do nothing;
drop policy staff_read on public.labour_rates;
create policy staff_read on public.labour_rates for select to authenticated using(public.has_permission('finance.read') or public.has_permission('workers.approve'));
drop policy staff_read on public.work_entries;
create policy staff_read on public.work_entries for select to authenticated using(public.has_permission('finance.read') or public.has_permission('workers.approve'));
-- PostgreSQL numeric NaN/Infinity must not pass positive-quantity checks.
do $$declare c record;begin for c in select table_name,column_name from information_schema.columns where table_schema='public' and data_type='numeric' loop execute format('alter table public.%I add constraint %I check (%I::text not in (''NaN'',''Infinity'',''-Infinity''))',c.table_name,'finite_'||c.column_name,c.column_name);end loop;end$$;
create or replace function public.inventory_balances() returns table(material_id uuid,name text,unit text,on_hand numeric,reserved numeric,available numeric,reorder_level numeric) language sql stable security invoker set search_path='' as $$select m.id,m.name,m.unit,coalesce(s.quantity,0),coalesce(r.quantity,0),coalesce(s.quantity,0)-coalesce(r.quantity,0),m.reorder_level from public.materials m left join(select material_id,sum(quantity) quantity from public.stock_movements group by material_id)s on s.material_id=m.id left join(select material_id,sum(quantity-consumed_quantity) quantity from public.stock_reservations where status='active' group by material_id)r on r.material_id=m.id where public.has_permission('inventory.read')$$;
create or replace function public.reserve_stock(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$declare result uuid;balance numeric;reserved numeric;material uuid;qty numeric;begin
 if not public.has_permission('production.write') then raise insufficient_privilege;end if;material=(payload->>'material_id')::uuid;qty=(payload->>'quantity')::numeric;perform 1 from public.materials where id=material for update;if not found then raise no_data_found;end if;
 select coalesce(sum(quantity),0) into balance from public.stock_movements where material_id=material;select coalesce(sum(quantity-consumed_quantity),0) into reserved from public.stock_reservations where material_id=material and status='active';if qty::text in('NaN','Infinity','-Infinity') or qty<=0 or balance-reserved<qty then raise exception 'Insufficient available stock';end if;
 insert into public.stock_reservations(material_id,work_order_id,quantity) values(material,(payload->>'work_order_id')::uuid,qty) returning id into result;return result;end$$;
create or replace function public.post_stock(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$declare material uuid;qty numeric;balance numeric;reserved numeric;cost bigint;result uuid;existing public.stock_movements;kind text;job uuid;remaining numeric;reservation record;take numeric;begin
 material=(payload->>'material_id')::uuid;qty=(payload->>'quantity')::numeric;kind=payload->>'kind';job=nullif(payload->>'work_order_id','')::uuid;
 if not public.has_permission(case when kind='consumption' then 'production.write' else 'inventory.approve' end) then raise insufficient_privilege;end if;
 perform 1 from public.materials where id=material for update;if not found then raise no_data_found;end if;
 select * into existing from public.stock_movements where idempotency_key=(payload->>'idempotency_key')::uuid;
 if found then if existing.material_id<>material or existing.quantity<>qty or existing.kind<>kind or existing.work_order_id is distinct from job or existing.note is distinct from payload->>'note' or(kind<>'consumption' and existing.unit_cost_minor is distinct from (payload->>'unit_cost_minor')::bigint) then raise exception 'Idempotency key conflict';end if;return existing.id;end if;
 if qty::text in('NaN','Infinity','-Infinity') or kind not in('adjustment','consumption','return') or qty=0 or(kind='return' and qty<=0)or(kind='consumption' and(qty>=0 or job is null)) then raise exception 'Invalid stock movement';end if;
 if kind='consumption' and not exists(select 1 from public.work_orders where id=job and status in('fabrication','finishing')) then raise exception 'An active production job is required';end if;
 select coalesce(sum(quantity),0) into balance from public.stock_movements where material_id=material;
 select coalesce(sum(quantity-consumed_quantity),0) into reserved from public.stock_reservations where material_id=material and status='active' and(kind<>'consumption' or work_order_id is distinct from job);
 if balance+qty<reserved then raise exception 'Insufficient available stock';end if;
 if kind='consumption' then select round(sum(quantity*unit_cost_minor)/nullif(balance,0))::bigint into cost from public.stock_movements where material_id=material;if cost is null or cost<0 then raise exception 'Stock cost cannot be reconciled';end if;else cost=(payload->>'unit_cost_minor')::bigint;end if;
 insert into public.stock_movements(material_id,quantity,unit_cost_minor,kind,work_order_id,note,idempotency_key) values(material,qty,cost,kind,job,payload->>'note',(payload->>'idempotency_key')::uuid) returning id into result;
 if kind='consumption' then
 remaining=-qty;
 for reservation in select * from public.stock_reservations where material_id=material and work_order_id=job and status='active' order by created_at,id for update loop
 take=least(remaining,reservation.quantity-reservation.consumed_quantity);update public.stock_reservations set consumed_quantity=consumed_quantity+take,status=case when consumed_quantity+take=quantity then 'consumed' else 'active' end where id=reservation.id;remaining=remaining-take;exit when remaining<=0;end loop;
 end if;return result;end$$;
commit;
