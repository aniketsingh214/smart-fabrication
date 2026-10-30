create policy staff_delete on public.product_media
  for delete to authenticated
  using (public.has_permission('catalog.write'));

create or replace function public.delete_product_media(target uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.has_permission('catalog.write') then
    raise insufficient_privilege;
  end if;
  delete from public.product_media where id = target;
end;
$$;

revoke all on function public.delete_product_media(uuid) from public,anon;
grant execute on function public.delete_product_media(uuid) to authenticated;

notify pgrst, 'reload schema';
