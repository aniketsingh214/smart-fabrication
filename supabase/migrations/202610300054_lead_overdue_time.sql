begin;
create or replace function public.filtered_sales_leads(search_term text default null,created_from timestamptz default null,created_until timestamptz default null,assignment text default null,lead_source text default null,followup_filter text default null,india_day_start timestamptz default null,india_day_end timestamptz default null)
returns setof public.leads language plpgsql stable security invoker set search_path='' as $$
begin
 if not public.has_permission('leads.read') then raise insufficient_privilege;end if;
 if search_term is not null and length(btrim(search_term)) not between 1 and 120 then raise exception 'Invalid search' using errcode='22023';end if;
 if created_from is not null and created_until is not null and created_from>=created_until then raise exception 'Invalid date range' using errcode='22023';end if;
 if assignment is not null and assignment not in('me','unassigned') and assignment !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'Invalid assignment' using errcode='22023';end if;
 if lead_source is not null and lead_source not in('google','instagram','facebook','whatsapp','direct','referral','other') then raise exception 'Invalid source' using errcode='22023';end if;
 if followup_filter is not null and (followup_filter not in('today','overdue') or india_day_start is null or india_day_end is null or india_day_start>=india_day_end) then raise exception 'Invalid follow-up filter' using errcode='22023';end if;
 return query select l.* from public.leads l
 where (search_term is null or l.id in(select public.crm_search_ids('leads',search_term)))
 and (created_from is null or l.created_at>=created_from) and (created_until is null or l.created_at<created_until)
 and (assignment is null or case assignment when 'me' then l.assigned_to=auth.uid() when 'unassigned' then l.assigned_to is null else l.assigned_to=assignment::uuid end)
 and (lead_source is null or l.source=lead_source)
 and (followup_filter is null or exists(select 1 from public.follow_ups f where f.lead_id=l.id and f.status='pending' and case followup_filter when 'today' then f.due_at>=india_day_start and f.due_at<india_day_end else f.due_at<now() end));
end$$;
revoke all on function public.filtered_sales_leads(text,timestamptz,timestamptz,text,text,text,timestamptz,timestamptz) from public,anon;
grant execute on function public.filtered_sales_leads(text,timestamptz,timestamptz,text,text,text,timestamptz,timestamptz) to authenticated;
notify pgrst,'reload schema';
commit;
