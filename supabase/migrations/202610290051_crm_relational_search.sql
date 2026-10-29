begin;
-- Literal substring matching: wildcard characters never become SQL patterns.
create function public.crm_id_matches(value uuid,term text) returns boolean language sql immutable set search_path='' as $$
 select value is not null and length(btrim(term))>=1 and length(btrim(term))<=120
 and not (btrim(term) ~ '^[+0-9 () .-]+$' and length(regexp_replace(term,'[^0-9]','','g'))>=7)
 and strpos(lower(value::text),lower(btrim(term)))>0
$$;
create function public.crm_contact_matches(record_id uuid,record_name text,record_phone text,record_email text,term text)
returns boolean language sql immutable set search_path='' as $$
 with t as(select lower(btrim(term)) needle,regexp_replace(term,'[^0-9]','','g') digits),
 n as(select *,case when length(digits)=12 and left(digits,2)='91' then right(digits,10) when length(digits)=11 and left(digits,1)='0' then right(digits,10) else digits end phone from t)
 select length(needle) between 1 and 120 and (public.crm_id_matches(record_id,term)
 or strpos(lower(coalesce(record_name,'')),needle)>0 or strpos(lower(coalesce(record_email,'')),needle)>0
 or (needle ~ '^[+0-9 () .-]+$' and length(phone)>=3 and strpos(regexp_replace(coalesce(record_phone,''),'[^0-9]','','g'),phone)>0)) from n
$$;
create function public.crm_search_ids(resource text,search_term text) returns setof uuid
language plpgsql stable security invoker set search_path='' as $$
begin
 if resource not in('leads','customers','quotations','follow-ups','measurements') or length(btrim(search_term)) not between 1 and 120 then raise exception 'Invalid CRM search' using errcode='22023';end if;
 if not public.has_permission(case when resource='customers' then 'customers.read' when resource='quotations' then 'quotations.read' else 'leads.read' end) then raise insufficient_privilege;end if;
 return query
 with l as materialized(select * from public.leads where public.has_permission('leads.read')),
 c as materialized(select * from public.customers where public.has_permission('customers.read')),
 q as materialized(select * from public.quotations where public.has_permission('quotations.read')),
 f as materialized(select * from public.follow_ups where public.has_permission('leads.read')),
 m as materialized(select * from public.measurements where public.has_permission('leads.read')),
 cs as(select id from c where public.crm_contact_matches(id,name,phone,email,search_term)),
 qs as(select id,lead_id,customer_id from q where public.crm_id_matches(id,search_term) or public.crm_id_matches(lead_id,search_term) or public.crm_id_matches(customer_id,search_term)),
 fs as(select id,lead_id from f where public.crm_id_matches(id,search_term) or public.crm_id_matches(lead_id,search_term)),
 ms as(select id,lead_id from m where public.crm_id_matches(id,search_term) or public.crm_id_matches(lead_id,search_term)),
 ls as(select id,customer_id from l where public.crm_contact_matches(id,name,phone,email,search_term)
 or public.crm_id_matches(customer_id,search_term) or public.crm_id_matches(product_id,search_term)
 or customer_id in(select id from cs) or id in(select lead_id from qs union select lead_id from fs union select lead_id from ms)),
 results as(
 select 'leads' kind,id from ls
 union select 'customers',id from c where id in(select id from cs union select customer_id from ls union select customer_id from qs union select customer_id from q where lead_id in(select id from ls))
 union select 'quotations',id from q where id in(select id from qs) or lead_id in(select id from ls) or customer_id in(select id from cs) or strpos(lower(name),lower(btrim(search_term)))>0
 union select 'follow-ups',id from f where id in(select id from fs) or lead_id in(select id from ls)
 union select 'measurements',id from m where id in(select id from ms) or lead_id in(select id from ls))
 select id from results where kind=resource;
end$$;
-- Returning the actual table type preserves PostgREST projection, filters, FK embeds and keyset pagination.
create function public.search_sales_leads(search_term text) returns setof public.leads language sql stable security invoker set search_path='' as $$select * from public.leads where id in(select public.crm_search_ids('leads',search_term))$$;
create function public.search_sales_customers(search_term text) returns setof public.customers language sql stable security invoker set search_path='' as $$select * from public.customers where id in(select public.crm_search_ids('customers',search_term))$$;
create function public.search_sales_quotations(search_term text) returns setof public.quotations language sql stable security invoker set search_path='' as $$select * from public.quotations where id in(select public.crm_search_ids('quotations',search_term))$$;
create function public.search_sales_follow_ups(search_term text) returns setof public.follow_ups language sql stable security invoker set search_path='' as $$select * from public.follow_ups where id in(select public.crm_search_ids('follow-ups',search_term))$$;
create function public.search_sales_measurements(search_term text) returns setof public.measurements language sql stable security invoker set search_path='' as $$select * from public.measurements where id in(select public.crm_search_ids('measurements',search_term))$$;
revoke all on function public.crm_id_matches(uuid,text),public.crm_contact_matches(uuid,text,text,text,text),public.crm_search_ids(text,text),public.search_sales_leads(text),public.search_sales_customers(text),public.search_sales_quotations(text),public.search_sales_follow_ups(text),public.search_sales_measurements(text) from public,anon;
grant execute on function public.crm_id_matches(uuid,text),public.crm_contact_matches(uuid,text,text,text,text),public.crm_search_ids(text,text),public.search_sales_leads(text),public.search_sales_customers(text),public.search_sales_quotations(text),public.search_sales_follow_ups(text),public.search_sales_measurements(text) to authenticated;
-- Protect new/relinked quotations; historical rows and unrelated updates remain untouched.
create function public.guard_crm_quote_customer() returns trigger language plpgsql security invoker set search_path='' as $$
declare expected uuid;
begin
 if TG_OP='UPDATE' and new.lead_id is not distinct from old.lead_id and new.customer_id is not distinct from old.customer_id then return new;end if;
 if new.lead_id is not null then
  select customer_id into expected from public.leads where id=new.lead_id for share;
  if not found then raise exception 'Linked lead is missing or inaccessible' using errcode='23514';end if;
  if expected is not null and expected<>new.customer_id then raise exception 'Quotation customer must match the linked lead customer' using errcode='23514';end if;
 end if;return new;
end$$;
create trigger crm_quote_customer before insert or update of lead_id,customer_id on public.quotations for each row execute function public.guard_crm_quote_customer();
revoke all on function public.guard_crm_quote_customer() from public,anon;
notify pgrst,'reload schema';
commit;
