begin;
create function public.can_access_lead(target uuid) returns boolean language sql stable security definer set search_path='' as $$select public.has_permission('leads.read') and exists(select 1 from public.leads l where l.id=target and(l.assigned_to is null or l.assigned_to=auth.uid() or public.has_permission('users.read')))$$;
create or replace function public.transition_lead(target uuid,next_status text,expected_version integer) returns void language plpgsql security definer set search_path='' as $$declare item public.leads;states text[];idx integer;begin
 if not public.has_permission('leads.write') or not public.can_access_lead(target) then raise insufficient_privilege;end if;
 select * into item from public.leads where id=target for update;if not found then raise no_data_found;end if;if item.version<>expected_version then raise exception 'Record changed; refresh and retry';end if;
 states=array['NEW','CONTACTED','REQUIREMENT_CONFIRMED','MEASUREMENT_PENDING','MEASUREMENT_DONE','QUOTATION_SENT','NEGOTIATION','ORDER_CONFIRMED','PRODUCTION','COMPLETED'];idx=array_position(states,item.status);
 if not(next_status='LOST' and item.status<>'COMPLETED' or item.status='LOST' and next_status='CONTACTED' or states[idx+1]=next_status) then raise exception 'Invalid lead transition';end if;
 update public.leads set status=next_status,version=version+1,updated_at=now() where id=target;insert into public.lead_status_history(lead_id,from_status,to_status,actor_id) values(target,item.status,next_status,auth.uid());end$$;
create function public.assign_lead(target uuid,staff_user uuid) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.has_permission('leads.write') or not public.can_access_lead(target) then raise insufficient_privilege;end if;
 if not public.has_permission('users.write') and staff_user is distinct from auth.uid() then raise exception 'Only owner may assign another staff member';end if;
 if not exists(select 1 from public.user_roles ur join public.profiles p on p.id=ur.user_id where ur.user_id=staff_user and ur.role_id in('owner','sales') and not p.disabled) then raise exception 'An active sales or owner account is required';end if;
 update public.leads set assigned_to=staff_user,version=version+1,updated_at=now() where id=target;end$$;
drop policy staff_update on public.leads;
create policy staff_update on public.leads for update to authenticated using(public.has_permission('leads.write') and public.can_access_lead(id)) with check(public.has_permission('leads.write') and(assigned_to is null or assigned_to=auth.uid() or public.has_permission('users.read')));
drop policy staff_read on public.lead_notes;
create policy staff_read on public.lead_notes for select to authenticated using(public.can_access_lead(lead_id));
drop policy staff_read on public.lead_status_history;
create policy staff_read on public.lead_status_history for select to authenticated using(public.can_access_lead(lead_id));
drop policy staff_read on public.measurements;
create policy staff_read on public.measurements for select to authenticated using(public.can_access_lead(lead_id));
drop policy staff_insert on public.measurements;
create policy staff_insert on public.measurements for insert to authenticated with check(public.has_permission('leads.write') and public.can_access_lead(lead_id) and verified_by=auth.uid());
drop policy staff_insert on public.lead_notes;
create policy staff_insert on public.lead_notes for insert to authenticated with check(public.has_permission('leads.write') and public.can_access_lead(lead_id) and created_by=auth.uid());
revoke update on public.measurements,public.lead_notes from authenticated;
create trigger measurements_append_only before update or delete on public.measurements for each row execute function public.immutable_record();
create trigger lead_notes_append_only before update or delete on public.lead_notes for each row execute function public.immutable_record();
create function public.lock_posted_document() returns trigger language plpgsql set search_path='' as $$begin
 if TG_TABLE_NAME='quotations' then if old.status<>'draft' and current_user in('authenticated','anon') then raise exception 'Approved quotation details are immutable';end if;end if;
 if TG_TABLE_NAME='purchases' then if old.status<>'draft' and current_user in('authenticated','anon') then raise exception 'Received purchase details are immutable';end if;end if;return new;end$$;
create trigger lock_posted_quote before update on public.quotations for each row execute function public.lock_posted_document();
create trigger lock_posted_purchase before update on public.purchases for each row execute function public.lock_posted_document();
create function public.disable_user(target uuid,disabled_value boolean) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.has_permission('users.write') then raise insufficient_privilege;end if;if target=auth.uid() then raise exception 'Cannot disable your own account';end if;update public.profiles set disabled=disabled_value where id=target;if not found then raise no_data_found;end if;end$$;
alter table public.work_entries add column idempotency_key uuid not null default gen_random_uuid() unique;
create or replace function public.post_work_entry(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$declare rate public.labour_rates;result uuid;qty numeric;existing public.work_entries;key uuid;begin
 if not public.has_permission('workers.approve') then raise insufficient_privilege;end if;qty=(payload->>'quantity')::numeric;key=(payload->>'idempotency_key')::uuid;if key is null then raise exception 'Idempotency key required';end if;
 perform pg_advisory_xact_lock(hashtextextended(key::text,0));select * into existing from public.work_entries where idempotency_key=key;if found then if existing.worker_id<>(payload->>'worker_id')::uuid or existing.work_order_id<>(payload->>'work_order_id')::uuid or existing.quantity<>qty then raise exception 'Idempotency key conflict';end if;return existing.id;end if;
 select * into rate from public.labour_rates where worker_id=(payload->>'worker_id')::uuid and effective_at<=now() order by effective_at desc,created_at desc limit 1;if not found then raise exception 'Worker has no current rate';end if;
 insert into public.work_entries(worker_id,work_order_id,labour_rate_id,quantity,rate_minor,amount_minor,idempotency_key) values(rate.worker_id,(payload->>'work_order_id')::uuid,rate.id,qty,rate.rate_minor,round(qty*rate.rate_minor),key) returning id into result;return result;end$$;
grant execute on function public.can_access_lead(uuid),public.assign_lead(uuid,uuid),public.disable_user(uuid,boolean) to authenticated;
revoke execute on function public.can_access_lead(uuid),public.assign_lead(uuid,uuid),public.disable_user(uuid,boolean),public.lock_posted_document() from public;
commit;
