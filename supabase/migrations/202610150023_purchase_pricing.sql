begin;
alter table public.purchase_items add column discount_minor bigint not null default 0 check(discount_minor>=0),add column tax_bps integer not null default 0 check(tax_bps between 0 and 10000),add column tax_recoverable boolean not null default false,add column net_minor bigint,add column tax_minor bigint,add column total_minor bigint,add column inventory_minor bigint;
alter table public.stock_movements add column book_value_minor bigint;
alter table public.purchase_returns add column inventory_value_minor bigint;
create function public.purchase_price_guard() returns trigger language plpgsql set search_path='' as $$begin
 if new.discount_minor>round(new.quantity*new.rate_minor) then raise exception 'Discount exceeds purchase line subtotal';end if;
 if round(new.quantity*new.rate_minor)>9000000000000 then raise exception 'Purchase line exceeds supported amount';end if;return new;end$$;
create trigger purchase_price_validation before insert or update on public.purchase_items for each row execute function public.purchase_price_guard();
create or replace function public.receive_purchase(target uuid) returns void language plpgsql security definer set search_path='' as $$
declare p public.purchases;item public.purchase_items;net bigint;tax bigint;inventory bigint;total bigint:=0;begin
 if not public.has_permission('purchases.approve') then raise insufficient_privilege;end if;
 select * into p from public.purchases where id=target for update;if not found then raise no_data_found;end if;if p.status='received' then return;end if;if p.status<>'draft' then raise exception 'Purchase is not receivable';end if;
 if not exists(select 1 from public.purchase_items where purchase_id=target) then raise exception 'Purchase needs line items';end if;
 for item in select * from public.purchase_items where purchase_id=target order by material_id,id for update loop
  net=round(item.quantity*item.rate_minor)-item.discount_minor;tax=round(net::numeric*item.tax_bps/10000);inventory=net+case when item.tax_recoverable then 0 else tax end;
  update public.purchase_items set net_minor=net,tax_minor=tax,total_minor=net+tax,inventory_minor=inventory where id=item.id;
  total=total+net+tax;if total>9000000000000 then raise exception 'Purchase total exceeds supported amount';end if;
  perform 1 from public.materials where id=item.material_id for update;
  insert into public.stock_movements(material_id,quantity,unit_cost_minor,book_value_minor,kind,purchase_id,note,idempotency_key) values(item.material_id,item.quantity,round(inventory::numeric/item.quantity),inventory,'receipt',target,'Purchase receipt',gen_random_uuid());
 end loop;
 update public.purchases set status='received',total_minor=total where id=target;
end$$;
create or replace function public.return_purchase_item(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare line public.purchase_items;p public.purchases;returned numeric;balance numeric;reserved numeric;qty numeric;amount bigint;prior_amount bigint;pool numeric;value bigint;result uuid;existing public.purchase_returns;key uuid;begin
 if not public.has_permission('purchases.approve') then raise insufficient_privilege;end if;
 key=(payload->>'idempotency_key')::uuid;qty=(payload->>'quantity')::numeric;
 if key is null or qty is null or qty::text in('NaN','Infinity','-Infinity') or qty<=0 or length(coalesce(payload->>'reason','')) not between 3 and 500 then raise exception 'Invalid purchase return';end if;
 perform pg_advisory_xact_lock(hashtextextended(key::text,0));select * into existing from public.purchase_returns where idempotency_key=key;
 if found then if existing.purchase_item_id is distinct from(payload->>'purchase_item_id')::uuid or existing.quantity is distinct from qty or existing.reason is distinct from payload->>'reason' or existing.created_by is distinct from auth.uid() then raise exception 'Idempotency key conflict';end if;return existing.id;end if;
 select * into line from public.purchase_items where id=(payload->>'purchase_item_id')::uuid;if not found then raise no_data_found;end if;
 select * into p from public.purchases where id=line.purchase_id for update;if p.status<>'received' then raise exception 'Only received purchases can be returned';end if;
 select coalesce(sum(quantity),0),coalesce(sum(amount_minor),0) into returned,prior_amount from public.purchase_returns where purchase_item_id=line.id;
 if returned+qty>line.quantity then raise exception 'Return exceeds received quantity';end if;
 amount=round(coalesce(line.total_minor,round(line.quantity*line.rate_minor))::numeric*(returned+qty)/line.quantity)-prior_amount;
 perform 1 from public.materials where id=line.material_id for update;
 select coalesce(sum(quantity),0),coalesce(sum(coalesce(book_value_minor,round(quantity*unit_cost_minor))),0) into balance,pool from public.stock_movements where material_id=line.material_id;
 select coalesce(sum(quantity-consumed_quantity),0) into reserved from public.stock_reservations where material_id=line.material_id and status='active';if balance-reserved<qty then raise exception 'Insufficient unreserved stock for return';end if;
 value=case when qty=balance then pool else round(pool*qty/balance) end;if value<0 then raise exception 'Stock value cannot be reconciled';end if;
 insert into public.purchase_returns(purchase_item_id,quantity,amount_minor,inventory_value_minor,reason,idempotency_key) values(line.id,qty,amount,value,payload->>'reason',key) returning id into result;
 insert into public.stock_movements(material_id,quantity,unit_cost_minor,book_value_minor,kind,purchase_id,note,idempotency_key) values(line.material_id,-qty,round(value::numeric/qty),-value,'return',p.id,payload->>'reason',gen_random_uuid());return result;
end$$;
-- Preserve the reservation logic while deriving all negative movement values from the actual pool.
do $$declare definition text;begin
 select pg_get_functiondef('public.post_stock(jsonb)'::regprocedure) into definition;
 definition=replace(definition,'cost bigint;','cost bigint;book_value bigint;pool numeric;');
 definition=replace(definition,'(kind<>''consumption'' and existing.unit_cost_minor','(qty>0 and existing.unit_cost_minor');
 definition=replace(definition,'if kind=''consumption'' then select round(sum(quantity*unit_cost_minor)/nullif(balance,0))::bigint into cost from public.stock_movements where material_id=material;if cost is null or cost<0 then raise exception ''Stock cost cannot be reconciled'';end if;else cost=(payload->>''unit_cost_minor'')::bigint;end if;',
 'if qty<0 then select sum(coalesce(book_value_minor,round(quantity*unit_cost_minor))) into pool from public.stock_movements where material_id=material;book_value=case when -qty=balance then -pool else round(pool*qty/nullif(balance,0)) end;cost=round(book_value::numeric/qty);if cost is null or cost<0 then raise exception ''Stock cost cannot be reconciled'';end if;else cost=(payload->>''unit_cost_minor'')::bigint;book_value=round(qty*cost);end if;');
 definition=replace(definition,'quantity,unit_cost_minor,kind,work_order_id','quantity,unit_cost_minor,book_value_minor,kind,work_order_id');
 definition=replace(definition,'values(material,qty,cost,kind,job','values(material,qty,cost,book_value,kind,job');
 if position('book_value=case' in definition)=0 then raise exception 'Stock function upgrade did not match expected baseline';end if;execute definition;
end$$;
revoke execute on function public.purchase_price_guard() from public;
commit;
