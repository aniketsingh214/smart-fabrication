begin;
alter table public.leads add column duplicate_of uuid references public.leads(id);
drop policy staff_read on public.follow_ups;
drop policy staff_insert on public.follow_ups;
drop policy staff_update on public.follow_ups;
create policy staff_read on public.follow_ups for select to authenticated using(public.can_access_lead(lead_id));
create policy staff_insert on public.follow_ups for insert to authenticated with check(public.has_permission('leads.write') and public.can_access_lead(lead_id));
create policy staff_update on public.follow_ups for update to authenticated using(public.has_permission('leads.write') and public.can_access_lead(lead_id)) with check(public.has_permission('leads.write') and public.can_access_lead(lead_id));
create trigger audit_followup after insert or update on public.follow_ups for each row execute function public.audit_change();
create function public.followup_assignment_guard() returns trigger language plpgsql set search_path='' as $$begin
 if new.assigned_to is not null then
  if not exists(select 1 from public.user_roles ur join public.profiles p on p.id=ur.user_id where ur.user_id=new.assigned_to and ur.role_id in('owner','sales') and not p.disabled) then raise exception 'An active sales or owner assignee is required';end if;
  if new.assigned_to<>auth.uid() and not public.has_permission('users.write') then raise insufficient_privilege;end if;
 end if;return new;end$$;
create trigger followup_assignee before insert or update on public.follow_ups for each row execute function public.followup_assignment_guard();
create or replace function public.submit_lead(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$declare result uuid;previous uuid;days integer:=30;configured text;begin
 perform pg_advisory_xact_lock(731014);
 if length(payload->>'name') not between 2 and 120 or(payload->>'phone')!~ '^\+?[0-9]{10,15}$' or length(payload->>'city') not between 2 and 100 or length(payload->>'requirement') not between 10 and 2000 then raise exception 'Invalid enquiry';end if;
 if(select count(*) from public.leads where phone=payload->>'phone' and created_at>now()-interval '1 hour')>=3 or(select count(*) from public.leads where created_at>now()-interval '1 hour')>=200 then raise exception 'Enquiry limit reached';end if;
 select value into configured from public.site_settings where name='lead_duplicate_days';if configured~'^[1-9][0-9]?$' then days=least(configured::integer,90);end if;
 select id into previous from public.leads where phone=payload->>'phone' and created_at>now()-make_interval(days=>days) order by created_at desc limit 1;
 insert into public.leads(name,phone,email,city,requirement,product_id,source,duplicate_of) values(payload->>'name',payload->>'phone',nullif(payload->>'email',''),payload->>'city',payload->>'requirement',nullif(payload->>'product_id','')::uuid,coalesce(payload->>'source','direct'),previous) returning id into result;
 insert into public.lead_status_history(lead_id,to_status) values(result,'NEW');
 insert into public.notifications(user_id,name,body) select distinct user_id,'New enquiry','A new enquiry is ready for follow-up.' from public.user_roles where role_id in('owner','sales');return result;end$$;
revoke execute on function public.followup_assignment_guard() from public;
commit;
