begin;
create function public.my_quotation_page(target uuid default null,after_created timestamptz default null,after_id uuid default null,page_limit integer default 25,text_filter text default null,status_filter text default null) returns table(id uuid,name text,status text,expires_at timestamptz,created_at timestamptz) language sql stable security definer set search_path='' as $$
 select q.id,q.name,q.status,q.expires_at,q.created_at from public.quotations q where public.owns_customer(q.customer_id) and q.status<>'draft' and(target is null or q.id=target) and(after_created is null or(q.created_at,q.id)<(after_created,after_id)) and(text_filter is null or q.name ilike '%'||left(text_filter,120)||'%') and(status_filter is null or q.status=status_filter) order by q.created_at desc,q.id desc limit greatest(1,least(page_limit,101))
$$;
revoke execute on function public.my_quotation_page(uuid,timestamptz,uuid,integer,text,text) from public,anon;
grant execute on function public.my_quotation_page(uuid,timestamptz,uuid,integer,text,text) to authenticated;
commit;
