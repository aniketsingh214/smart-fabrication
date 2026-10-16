begin;
alter table public.notifications add column event_key text unique;
alter table public.notifications add column entity_type text;
alter table public.notifications add column entity_id uuid;
create function public.notify_status_change() returns trigger language plpgsql security definer set search_path='' as $$declare customer_user uuid;recipient uuid;key text;begin
 if old.status is not distinct from new.status then return new;end if;
 if TG_TABLE_NAME='quotations' then select user_id into customer_user from public.customers where id=new.customer_id;
 elsif TG_TABLE_NAME='orders' then select user_id into customer_user from public.customers where id=new.customer_id;end if;
 for recipient in select distinct user_id from public.user_roles where role_id in('owner','sales') union select customer_user where customer_user is not null loop
 key=TG_TABLE_NAME||':'||new.id||':'||new.status||':'||recipient;
 insert into public.notifications(user_id,name,body,event_key,entity_type,entity_id) values(recipient,case when TG_TABLE_NAME='orders' then 'Order updated' else 'Quotation updated' end,'Status: '||new.status,key,TG_TABLE_NAME,new.id) on conflict(event_key) do nothing;
 end loop;return new;end$$;
create trigger notify_quotation_status after update on public.quotations for each row execute function public.notify_status_change();
create trigger notify_order_status after update on public.orders for each row execute function public.notify_status_change();
create function public.dispatch_due_notifications() returns integer language plpgsql security definer set search_path='' as $$declare f record;recipient uuid;added integer:=0;n integer;begin
 update public.quotations set status='expired' where status in('draft','approved') and expires_at<=now();
 for f in select fu.id,fu.due_at,coalesce(fu.assigned_to,l.assigned_to) staff from public.follow_ups fu join public.leads l on l.id=fu.lead_id where fu.status='pending' and fu.due_at<=now() loop
 for recipient in select f.staff where f.staff is not null union select user_id from public.user_roles where role_id='owner' and f.staff is null loop
 insert into public.notifications(user_id,name,body,event_key,entity_type,entity_id) values(recipient,'Follow-up due','A scheduled follow-up is ready for action.','followup:'||f.id||':'||f.due_at||':'||recipient,'follow_ups',f.id) on conflict(event_key) do nothing;get diagnostics n=row_count;added=added+n;
 end loop;end loop;return added;end$$;
create function public.set_role_permission(role_name text,permission_name text,enabled boolean) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.has_permission('users.write') then raise insufficient_privilege;end if;if role_name in('owner','customer') then raise exception 'Owner and customer base roles cannot be modified';end if;
 if enabled then insert into public.role_permissions(role_id,permission_id) values(role_name,permission_name) on conflict do nothing;else delete from public.role_permissions where role_id=role_name and permission_id=permission_name;end if;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,new_status) values(auth.uid(),case when enabled then 'GRANT' else 'REVOKE' end,'role_permission',role_name||':'||permission_name,null);end$$;
grant execute on function public.set_role_permission(text,text,boolean) to authenticated;
grant execute on function public.dispatch_due_notifications() to service_role;
revoke execute on function public.notify_status_change(),public.dispatch_due_notifications(),public.set_role_permission(text,text,boolean) from public;
alter table public.quotation_versions add constraint safe_money check(total_minor<=9000000000000);
alter table public.orders add constraint safe_money check(total_minor<=9000000000000);
create or replace function public.transition_lead(target uuid,next_status text,expected_version integer) returns void language plpgsql security definer set search_path='' as $$declare item public.leads;states text[];idx integer;begin
 if not public.has_permission('leads.write') or not public.can_access_lead(target) then raise insufficient_privilege;end if;
 select * into item from public.leads where id=target for update;if not found then raise no_data_found;end if;if item.version<>expected_version then raise exception 'Record changed; refresh and retry';end if;
 states=array['NEW','CONTACTED','REQUIREMENT_CONFIRMED','MEASUREMENT_PENDING','MEASUREMENT_DONE','QUOTATION_SENT','NEGOTIATION','ORDER_CONFIRMED','PRODUCTION','COMPLETED'];idx=array_position(states,item.status);
 if not coalesce((next_status='LOST' and item.status<>'COMPLETED' or item.status='LOST' and next_status='CONTACTED' or states[idx+1]=next_status),false) then raise exception 'Invalid lead transition';end if;
 if next_status='MEASUREMENT_DONE' and not exists(select 1 from public.measurements where lead_id=target) then raise exception 'Verified measurement required';end if;
 if next_status='QUOTATION_SENT' and not exists(select 1 from public.quotations where lead_id=target and status in('approved','accepted')) then raise exception 'Approved quotation required';end if;
 if next_status='ORDER_CONFIRMED' and not exists(select 1 from public.orders o join public.quotation_versions v on v.id=o.quotation_version_id join public.quotations q on q.id=v.quotation_id where q.lead_id=target) then raise exception 'Confirmed order required';end if;
 if next_status='COMPLETED' and not exists(select 1 from public.orders o join public.quotation_versions v on v.id=o.quotation_version_id join public.quotations q on q.id=v.quotation_id where q.lead_id=target and o.status='COMPLETED') then raise exception 'Completed order required';end if;
 update public.leads set status=next_status,version=version+1,updated_at=now() where id=target;insert into public.lead_status_history(lead_id,from_status,to_status,actor_id) values(target,item.status,next_status,auth.uid());end$$;
commit;
