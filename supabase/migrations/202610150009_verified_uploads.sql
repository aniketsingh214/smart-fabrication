begin;
alter table public.upload_intents alter column owner_user_id drop not null;
alter table public.upload_intents add column lead_id uuid references public.leads(id);
alter table public.upload_intents add constraint upload_actor check(owner_user_id is not null or lead_id is not null);
create table public.lead_attachments(id uuid primary key default gen_random_uuid(),lead_id uuid not null references public.leads(id),media_id uuid not null unique references public.media_assets(id),created_at timestamptz not null default now());
alter table public.lead_attachments enable row level security;
create policy assigned_lead_attachments on public.lead_attachments for select to authenticated using(public.can_access_lead(lead_id));
create policy lead_media_metadata on public.media_assets for select to authenticated using(exists(select 1 from public.lead_attachments a where a.media_id=id and public.can_access_lead(a.lead_id)));
create policy own_media_metadata on public.media_assets for select to authenticated using(owner_user_id=auth.uid());
grant select on public.lead_attachments to authenticated;
create function public.create_verified_upload_intent(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$declare actor uuid;lead uuid;result uuid;begin
 actor=nullif(payload->>'owner_user_id','')::uuid;lead=nullif(payload->>'lead_id','')::uuid;result=(payload->>'id')::uuid;
 if actor is null and lead is null then raise exception 'Upload actor required';end if;
 perform pg_advisory_xact_lock(hashtextextended(coalesce(actor,lead)::text,1));
 if actor is not null then
  if not exists(select 1 from public.profiles where id=actor and not disabled) then raise exception 'Active upload actor required';end if;
  if(select count(*) from public.upload_intents where owner_user_id=actor and created_at>now()-interval '1 hour')>=30 then raise exception 'Upload limit reached';end if;
 else
  if not exists(select 1 from public.leads where id=lead and created_at>now()-interval '15 minutes') then raise exception 'Enquiry upload window expired';end if;
  if payload->>'context'<>'customer_design' or payload->>'visibility'<>'private' then raise exception 'Guest uploads must be private customer designs';end if;
  if(select count(*) from public.upload_intents where lead_id=lead)>=3 then raise exception 'Enquiry upload limit reached';end if;
 end if;
 insert into public.upload_intents(id,owner_user_id,lead_id,public_id,context,visibility,expires_at) values(result,actor,lead,payload->>'public_id',payload->>'context',payload->>'visibility',now()+interval '5 minutes');return result;end$$;
create function public.finalize_verified_upload(target uuid,asset jsonb) returns uuid language plpgsql security definer set search_path='' as $$declare intent public.upload_intents;result uuid;begin
 select * into intent from public.upload_intents where id=target for update;if not found then raise no_data_found;end if;
 if intent.confirmed_at is not null then select id into result from public.media_assets where public_id=intent.public_id;return result;end if;
 if intent.expires_at<now() then raise exception 'Upload intent expired';end if;
 if asset->>'public_id'<>intent.public_id or asset->>'format' not in('jpg','jpeg','png','webp') or(asset->>'bytes')::bigint not between 1 and 10485760 then raise exception 'Invalid verified asset';end if;
 insert into public.media_assets(asset_id,public_id,resource_type,format,bytes,width,height,owner_user_id,visibility,context) values(asset->>'asset_id',intent.public_id,'image',asset->>'format',(asset->>'bytes')::bigint,(asset->>'width')::integer,(asset->>'height')::integer,intent.owner_user_id,intent.visibility,intent.context) returning id into result;
 if intent.lead_id is not null then insert into public.lead_attachments(lead_id,media_id) values(intent.lead_id,result);end if;
 update public.upload_intents set confirmed_at=now() where id=target;return result;end$$;
grant execute on function public.create_verified_upload_intent(jsonb),public.finalize_verified_upload(uuid,jsonb) to service_role;
revoke execute on function public.create_verified_upload_intent(jsonb),public.finalize_verified_upload(uuid,jsonb) from public,anon,authenticated;
commit;
