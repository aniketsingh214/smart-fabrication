begin;
create or replace function public.workflow_guard() returns trigger language plpgsql set search_path='' as $$begin
 case TG_TABLE_NAME
 when 'customers' then
  if TG_OP='UPDATE' then if old.user_id is distinct from new.user_id and not public.has_permission('users.write') then raise exception 'Identity linking requires owner';end if;end if;
 when 'work_orders' then
  if TG_OP='INSERT' then if new.status<>'pending' then raise exception 'Work orders must begin as pending';end if;
  elsif old.status is distinct from new.status then
   if not ((old.status='pending' and new.status='fabrication')or(old.status='fabrication' and new.status='finishing')or(old.status='finishing' and new.status='quality_check')or(old.status='quality_check' and new.status='ready')) then raise exception 'Invalid production stage';end if;
   if new.status='ready' and not exists(select 1 from public.quality_checks where work_order_id=new.id and passed) then raise exception 'Passed quality check required';end if;
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
 return new;end$$;
create or replace function public.protect_business_updates() returns trigger language plpgsql set search_path='' as $$begin
 case TG_TABLE_NAME
 when 'quotations' then if old.status<>new.status and current_user in('authenticated','anon') then raise exception 'Use quotation workflow';end if;
 when 'leads' then if old.status<>new.status and current_user in('authenticated','anon') then raise exception 'Use lead transition function';end if;
 when 'purchases' then if(old.status<>new.status or old.total_minor<>new.total_minor) and current_user in('authenticated','anon') then raise exception 'Use purchase workflow';end if;
 when 'purchase_items' then if exists(select 1 from public.purchases where id=coalesce(new.purchase_id,old.purchase_id) and status<>'draft') then raise exception 'Posted purchase items are immutable';end if;
 when 'expenses' then
  if old.status='approved' then raise exception 'Approved expenses are immutable';end if;
  if old.status<>new.status and not public.has_permission('finance.approve') then raise insufficient_privilege;end if;
 when 'bom_items' then if exists(select 1 from public.bom_versions where id=coalesce(new.bom_id,old.bom_id) and status='published') then raise exception 'Published BOM is immutable';end if;
 else null;
 end case;
 return new;end$$;
commit;
