begin;
create function public.version_parent_guard() returns trigger language plpgsql set search_path='' as $$declare old_parent uuid;new_parent uuid;begin
 if TG_TABLE_NAME='bom_versions' then
  if TG_OP='INSERT' and new.status<>'draft' then raise exception 'Create a draft BOM, add its materials, then publish';end if;
  if TG_OP='UPDATE' and new.status='published' then if not exists(select 1 from public.bom_items where bom_id=new.id) then raise exception 'A published BOM needs material lines';end if;end if;
 elsif TG_TABLE_NAME='calculation_rules' then if TG_OP='INSERT' and new.status<>'draft' then raise exception 'Create and review a draft pricing rule before publication';end if;
 elsif TG_TABLE_NAME='bom_items' then
  if TG_OP<>'INSERT' then old_parent=old.bom_id;if exists(select 1 from public.bom_versions where id=old_parent and status<>'draft') then raise exception 'Published BOM materials are immutable';end if;end if;
  if TG_OP<>'DELETE' then new_parent=new.bom_id;if exists(select 1 from public.bom_versions where id=new_parent and status<>'draft') then raise exception 'Edit materials only on draft BOM versions';end if;end if;
 elsif TG_TABLE_NAME='purchase_items' then
  if TG_OP<>'INSERT' then if exists(select 1 from public.purchases where id=old.purchase_id and status<>'draft') then raise exception 'Received purchase items are immutable';end if;end if;
  if TG_OP<>'DELETE' then if exists(select 1 from public.purchases where id=new.purchase_id and status<>'draft') then raise exception 'Edit only draft purchase items';end if;end if;
 end if;return coalesce(new,old);end$$;
create trigger bom_publication_guard before insert or update on public.bom_versions for each row execute function public.version_parent_guard();
create trigger pricing_publication_guard before insert on public.calculation_rules for each row execute function public.version_parent_guard();
create trigger bom_line_parent_guard before insert or update or delete on public.bom_items for each row execute function public.version_parent_guard();
create trigger purchase_line_parent_guard before insert or update or delete on public.purchase_items for each row execute function public.version_parent_guard();
create function public.completion_evidence_guard() returns trigger language plpgsql set search_path='' as $$begin
 if TG_TABLE_NAME='deliveries' then
  if new.status='delivered' and not exists(select 1 from public.media_assets where id=new.proof_media_id and context='delivery_proof' and visibility='private') then raise exception 'Verified private delivery proof is required';end if;
 elsif TG_TABLE_NAME='installations' then
  if new.status='completed' then
   if not new.customer_confirmed or not(new.checklist @> '{"fixings_checked":true,"alignment_checked":true,"finish_checked":true,"site_cleaned":true}'::jsonb) then raise exception 'Complete installation checks and obtain customer confirmation';end if;
   if not exists(select 1 from public.deliveries where id=new.delivery_id and status='delivered') then raise exception 'Delivery must be confirmed before installation completion';end if;
  end if;
 end if;return new;end$$;
create trigger delivery_evidence_guard before insert or update on public.deliveries for each row execute function public.completion_evidence_guard();
create trigger installation_evidence_guard before insert or update on public.installations for each row execute function public.completion_evidence_guard();
-- Keep paid balances and returns serialized on their purchase row; use remaining reservation amounts.
do $$declare definition text;begin
 select pg_get_functiondef('public.post_payment(text,jsonb)'::regprocedure) into definition;
 definition=replace(definition,'select total_minor into total from public.purchases where id=target and status=''received'';','select total_minor into total from public.purchases where id=target and status=''received'' for update;');execute definition;
 select pg_get_functiondef('public.return_purchase_item(jsonb)'::regprocedure) into definition;
 definition=replace(definition,'sum(quantity),0) into reserved from public.stock_reservations','sum(quantity-consumed_quantity),0) into reserved from public.stock_reservations');execute definition;
end$$;
revoke execute on function public.version_parent_guard(),public.completion_evidence_guard() from public;
commit;
