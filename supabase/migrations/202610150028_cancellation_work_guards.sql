begin;
create function public.guard_cancellation_work() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.status='CANCELLED' and old.status<>'CANCELLED' then
  if exists(select 1 from public.work_orders where order_id=new.id and status<>'pending') or exists(select 1 from public.work_entries e join public.work_orders w on w.id=e.work_order_id where w.order_id=new.id) or exists(select 1 from public.stock_movements s join public.work_orders w on w.id=s.work_order_id where w.order_id=new.id and s.kind='consumption') then raise exception 'Review production activity before cancelling or refunding this order';end if;
  if exists(select 1 from public.stock_reservations r join public.work_orders w on w.id=r.work_order_id where w.order_id=new.id and r.status='active') then raise exception 'Release unused material reservations before cancellation';end if;
 end if;return new;end$$;
create trigger cancellation_work_guard before update on public.orders for each row execute function public.guard_cancellation_work();
create function public.guard_cancelled_order_work() returns trigger language plpgsql security definer set search_path='' as $$
declare target_order uuid;job uuid;state text;begin
 if TG_TABLE_NAME='work_orders' then target_order=new.order_id;
 else
  if TG_TABLE_NAME='stock_movements' then if new.kind<>'consumption' or new.work_order_id is null then return new;end if;end if;
  if TG_TABLE_NAME='stock_reservations' then if new.status='released' then return new;end if;end if;
  job=new.work_order_id;select order_id into target_order from public.work_orders where id=job;
 end if;
 select status into state from public.orders where id=target_order for update;
 if state='CANCELLED' then raise exception 'Cancelled orders cannot receive production work, reservations or earnings';end if;
 return new;end$$;
create trigger cancelled_job_guard before insert or update on public.work_orders for each row execute function public.guard_cancelled_order_work();
create trigger cancelled_reservation_guard before insert or update on public.stock_reservations for each row execute function public.guard_cancelled_order_work();
create trigger cancelled_earning_guard before insert on public.work_entries for each row execute function public.guard_cancelled_order_work();
create trigger cancelled_consumption_guard before insert on public.stock_movements for each row execute function public.guard_cancelled_order_work();
revoke execute on function public.guard_cancellation_work(),public.guard_cancelled_order_work() from public;
commit;
