begin;
-- PostgREST cannot reliably embed customer_id through an RPC source's lead relation.
-- Filter this exact relationship inside the invoker function instead, before paging.
drop function public.search_sales_follow_ups(text);
drop function public.search_sales_measurements(text);
create function public.search_sales_follow_ups(search_term text,customer_context uuid default null)
returns setof public.follow_ups language sql stable security invoker set search_path='' as $$
 select f.* from public.follow_ups f
 where f.id in(select public.crm_search_ids('follow-ups',search_term))
 and (customer_context is null or exists(select 1 from public.leads l where l.id=f.lead_id and l.customer_id=customer_context))
$$;
create function public.search_sales_measurements(search_term text,customer_context uuid default null)
returns setof public.measurements language sql stable security invoker set search_path='' as $$
 select m.* from public.measurements m
 where m.id in(select public.crm_search_ids('measurements',search_term))
 and (customer_context is null or exists(select 1 from public.leads l where l.id=m.lead_id and l.customer_id=customer_context))
$$;
revoke all on function public.search_sales_follow_ups(text,uuid),public.search_sales_measurements(text,uuid) from public,anon;
grant execute on function public.search_sales_follow_ups(text,uuid),public.search_sales_measurements(text,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
