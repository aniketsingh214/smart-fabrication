begin;
alter table public.upload_intents add column resource_type text not null default 'image' check(resource_type in('image','video'));
alter table public.upload_intents add constraint catalog_video_only check(resource_type='image' or (context='product' and visibility='public' and owner_user_id is not null and lead_id is null));
alter table public.media_assets add column duration_seconds numeric check(duration_seconds>0 and duration_seconds<=120);
do $patch$
declare definition text;
begin
 select pg_get_functiondef('public.create_verified_upload_intent(jsonb)'::regprocedure) into definition;
 if position('public_id,context,visibility,expires_at)' in definition)=0 then raise exception 'Unexpected upload intent function';end if;
 definition:=replace(definition,'public_id,context,visibility,expires_at)','public_id,context,visibility,expires_at,resource_type)');
 if position($before$now()+interval '5 minutes');return result;$before$ in definition)=0 then raise exception 'Unexpected upload expiry definition';end if;
 definition:=replace(definition,$before$now()+interval '5 minutes');return result;$before$,$after$now()+interval '5 minutes',coalesce(payload->>'resource_type','image'));return result;$after$);
 execute definition;
end$patch$;
create or replace function public.finalize_verified_upload(target uuid,asset jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare intent public.upload_intents;result uuid;kind text;duration numeric;size bigint;
begin
 select * into intent from public.upload_intents where id=target for update;if not found then raise no_data_found;end if;
 if intent.confirmed_at is not null then select id into result from public.media_assets where public_id=intent.public_id;return result;end if;
 if intent.expires_at<now() then raise exception 'Upload intent expired';end if;
 kind:=coalesce(asset->>'resource_type','image');size:=(asset->>'bytes')::bigint;
 if asset->>'public_id' is distinct from intent.public_id or kind<>intent.resource_type or size is null or size<=0 then raise exception 'Invalid verified asset';end if;
 if kind='image' then
  if asset->>'format' is null or asset->>'format' not in('jpg','jpeg','png','webp') or size>10485760 then raise exception 'Invalid image asset';end if;
 else
  duration:=(asset->>'duration')::numeric;
  if intent.context<>'product' or intent.visibility<>'public' or asset->>'format' is null or asset->>'format' not in('mp4','webm','mov') or size>104857600 or duration is null or duration<=0 or duration>120 then raise exception 'Invalid catalog video';end if;
 end if;
 insert into public.media_assets(asset_id,public_id,resource_type,format,bytes,width,height,duration_seconds,owner_user_id,visibility,context) values(asset->>'asset_id',intent.public_id,kind,asset->>'format',size,(asset->>'width')::integer,(asset->>'height')::integer,duration,intent.owner_user_id,intent.visibility,intent.context) returning id into result;
 if intent.lead_id is not null then insert into public.lead_attachments(lead_id,media_id) values(intent.lead_id,result);end if;
 update public.upload_intents set confirmed_at=now() where id=target;return result;
end$$;
-- Preserve service-only access regardless of project default grants.
revoke execute on function public.create_verified_upload_intent(jsonb),public.finalize_verified_upload(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.create_verified_upload_intent(jsonb),public.finalize_verified_upload(uuid,jsonb) to service_role;
commit;
