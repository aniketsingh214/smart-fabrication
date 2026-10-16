begin;
-- Private order notes and actor IDs must not be exposed by a customer row policy.
drop policy own_orders on public.orders;
drop policy own_timeline on public.order_status_history;
create function public.my_orders(target uuid default null,after_created timestamptz default null,after_id uuid default null,page_limit integer default 25,text_filter text default null,status_filter text default null) returns table(id uuid,name text,total_minor bigint,status text,due_at timestamptz,version integer,created_at timestamptz) language sql stable security definer set search_path='' as $$
 select o.id,o.name,o.total_minor,o.status,o.due_at,o.version,o.created_at from public.orders o where public.owns_customer(o.customer_id) and(target is null or o.id=target) and(after_created is null or(o.created_at,o.id)<(after_created,after_id)) and(text_filter is null or o.name ilike '%'||left(text_filter,120)||'%') and(status_filter is null or o.status=status_filter) order by o.created_at desc,o.id desc limit greatest(1,least(page_limit,101))
$$;
create function public.my_quotations() returns table(id uuid,name text,status text,expires_at timestamptz,created_at timestamptz) language sql stable security definer set search_path='' as $$select q.id,q.name,q.status,q.expires_at,q.created_at from public.quotations q where public.owns_customer(q.customer_id) and q.status<>'draft' order by q.created_at desc limit 100$$;
create function public.customer_order_timeline(target uuid) returns table(id uuid,to_status text,created_at timestamptz) language sql stable security definer set search_path='' as $$select h.id,h.to_status,h.created_at from public.order_status_history h join public.orders o on o.id=h.order_id where h.order_id=target and(public.owns_customer(o.customer_id) or public.has_permission('orders.read')) order by h.created_at,h.id$$;
grant execute on function public.my_orders(uuid,timestamptz,uuid,integer,text,text),public.my_quotations(),public.customer_order_timeline(uuid) to authenticated;
revoke execute on function public.my_orders(uuid,timestamptz,uuid,integer,text,text),public.my_quotations(),public.customer_order_timeline(uuid) from public;
commit;
