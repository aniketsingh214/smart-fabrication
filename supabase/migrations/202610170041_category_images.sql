-- Category photos use existing verified public product-image assets only.
alter table public.categories add column image_media_id uuid references public.media_assets(id);
create function public.category_image_guard() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.image_media_id is not null and not exists(
  select 1 from public.media_assets m join public.upload_intents i on i.public_id=m.public_id
  where m.id=new.image_media_id and m.context='product' and m.visibility='public'
   and m.resource_type='image' and m.format in('jpg','jpeg','png','webp') and i.confirmed_at is not null
 ) then raise exception using errcode='23514',message='Category image must be a verified public product photo';end if;
 return new;
end $$;
revoke all on function public.category_image_guard() from public,anon,authenticated;
create trigger category_verified_image before insert or update of image_media_id on public.categories
for each row execute function public.category_image_guard();
notify pgrst,'reload schema';
