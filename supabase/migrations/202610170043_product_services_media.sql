alter table public.products
 add column delivery_availability text not null default 'confirm_with_workshop' check(delivery_availability in('confirm_with_workshop','available','unavailable')),
 add column installation_availability text not null default 'confirm_with_workshop' check(installation_availability in('confirm_with_workshop','available','unavailable'));
do $patch$ declare definition text;begin
 select pg_get_functiondef('public.duplicate_product(uuid,jsonb,uuid)'::regprocedure) into definition;
 if position('custom_size,status)' in definition)=0 or position('source.custom_size,''draft'')' in definition)=0 then raise exception 'Unexpected product duplication definition';end if;
 definition:=replace(definition,'custom_size,status)','custom_size,delivery_availability,installation_availability,status)');
 definition:=replace(definition,'source.custom_size,''draft'')','source.custom_size,source.delivery_availability,source.installation_availability,''draft'')');
 execute definition;
end $patch$;
create function public.product_media_verification_guard() returns trigger language plpgsql security definer set search_path='' as $$begin
 if not exists(select 1 from public.media_assets m join public.upload_intents i on i.public_id=m.public_id
 where m.id=new.media_id and m.context='product' and m.visibility='public' and i.confirmed_at is not null
 and ((m.resource_type='image' and m.format in('jpg','jpeg','png','webp')) or (m.resource_type='video' and m.format in('mp4','webm','mov'))))
 then raise exception using errcode='23514',message='Product media must be a verified public catalog image or video';end if;
 return new;end $$;
revoke all on function public.product_media_verification_guard() from public,anon,authenticated;
create trigger product_verified_media before insert or update on public.product_media for each row execute function public.product_media_verification_guard();
notify pgrst,'reload schema';
