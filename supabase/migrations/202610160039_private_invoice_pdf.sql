begin;
-- Only private, owned invoice PDFs may be finalized; image/video policy remains unchanged.
alter table public.media_assets add constraint private_invoice_pdf_only check(format<>'pdf' or (context='invoice' and visibility='private' and resource_type='image' and owner_user_id is not null));
do $patch$
declare definition text;
begin
 select pg_get_functiondef('public.finalize_verified_upload(uuid,jsonb)'::regprocedure) into definition;
 if position($before$if asset->>'format' is null or asset->>'format' not in('jpg','jpeg','png','webp') or size>10485760 then raise exception 'Invalid image asset';end if;$before$ in definition)=0 then raise exception 'Unexpected verified upload definition';end if;
 definition:=replace(definition,$before$if asset->>'format' is null or asset->>'format' not in('jpg','jpeg','png','webp') or size>10485760 then raise exception 'Invalid image asset';end if;$before$,$after$if asset->>'format'='pdf' then
   if intent.context<>'invoice' or intent.visibility<>'private' or intent.owner_user_id is null or intent.lead_id is not null or size>10485760 then raise exception 'Invalid private invoice PDF';end if;
  elsif asset->>'format' is null or asset->>'format' not in('jpg','jpeg','png','webp') or size>10485760 then raise exception 'Invalid image asset';end if;$after$);
 execute definition;
end$patch$;
revoke execute on function public.finalize_verified_upload(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.finalize_verified_upload(uuid,jsonb) to service_role;
commit;
