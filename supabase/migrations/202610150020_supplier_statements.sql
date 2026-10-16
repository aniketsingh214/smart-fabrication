begin;
create function public.supplier_statement(target uuid,after_created timestamptz default null,after_kind text default null,after_id uuid default null,page_limit integer default 26) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare supplier_name text;result jsonb;begin
 if not(public.has_permission('finance.read') and public.has_permission('suppliers.read') and public.has_permission('purchases.read')) then raise insufficient_privilege;end if;
 if (after_created is not null or after_kind is not null or after_id is not null) and not(after_created is not null and after_kind in('invoice','payment','return') and after_id is not null) then raise exception 'Invalid statement cursor';end if;
 select name into supplier_name from public.suppliers where id=target;if not found then raise no_data_found;end if;
 with posted as(select id,total_minor,bill_number,created_at from public.purchases where supplier_id=target and status='received'),
 events as(
  select id,'invoice'::text kind,created_at,bill_number reference,total_minor::numeric delta_minor from posted
  union all select r.id,'return',r.created_at,r.reason,-r.amount_minor::numeric from public.purchase_returns r join public.purchase_items i on i.id=r.purchase_item_id join posted p on p.id=i.purchase_id
  union all select s.id,'payment',s.created_at,s.reference,-s.amount_minor::numeric from public.supplier_payments s join posted p on p.id=s.purchase_id
 ), page as(select * from events where after_created is null or(created_at,kind,id)<(after_created,after_kind,after_id) order by created_at desc,kind desc,id desc limit greatest(1,least(page_limit,101)))
 select jsonb_build_object('supplier',jsonb_build_object('id',target,'name',supplier_name),'summary',jsonb_build_object('invoiced_minor',coalesce((select sum(delta_minor) from events where kind='invoice'),0),'returned_minor',coalesce((select -sum(delta_minor) from events where kind='return'),0),'paid_minor',coalesce((select -sum(delta_minor) from events where kind='payment'),0),'outstanding_minor',coalesce((select sum(delta_minor) from events),0)),'entries',coalesce((select jsonb_agg(to_jsonb(page) order by created_at desc,kind desc,id desc) from page),'[]')) into result;
 return result;
end$$;
revoke execute on function public.supplier_statement(uuid,timestamptz,text,uuid,integer) from public;
grant execute on function public.supplier_statement(uuid,timestamptz,text,uuid,integer) to authenticated;
commit;
