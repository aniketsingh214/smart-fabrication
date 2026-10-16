begin;
-- RLS is row-based: an own-customer SELECT policy would also reveal internal staff notes.
-- Resolve ownership through a boolean function and return an explicit customer DTO instead.
create function public.active_user() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.profiles where id=auth.uid() and not disabled)$$;
create function public.owns_customer(target uuid) returns boolean language sql stable security definer set search_path='' as $$select public.active_user() and exists(select 1 from public.customers where id=target and user_id=auth.uid())$$;
drop policy own_customer on public.customers;
drop policy own_quotes on public.quotations;
create policy own_quotes on public.quotations for select to authenticated using(status<>'draft' and public.owns_customer(customer_id));
drop policy own_quote_versions on public.quotation_versions;
create policy own_quote_versions on public.quotation_versions for select to authenticated using(exists(select 1 from public.quotations q where q.id=quotation_id and q.status<>'draft' and public.owns_customer(q.customer_id)));
drop policy own_orders on public.orders;
create policy own_orders on public.orders for select to authenticated using(public.owns_customer(customer_id));
drop policy own_timeline on public.order_status_history;
create policy own_timeline on public.order_status_history for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and public.owns_customer(o.customer_id)));
create function public.my_customer_profile() returns jsonb language sql stable security definer set search_path='' as $$select jsonb_build_object('id',id,'name',name,'phone',phone,'email',email,'address',address) from public.customers where user_id=auth.uid() and public.active_user()$$;
create or replace function public.respond_quotation(target uuid,accepted boolean) returns void language plpgsql security definer set search_path='' as $$begin
 perform 1 from public.quotations q where q.id=target and q.status='approved' and q.expires_at>now() and(public.owns_customer(q.customer_id) or public.has_permission('quotations.approve')) for update;
 if not found then raise exception 'Quotation cannot be accepted or rejected';end if;update public.quotations set status=case when accepted then 'accepted' else 'rejected' end where id=target;end$$;
create policy own_profile_name on public.profiles for update to authenticated using(id=auth.uid() and not disabled) with check(id=auth.uid() and not disabled);
revoke update on public.profiles from authenticated;
grant update(display_name) on public.profiles to authenticated;
drop policy own_media_metadata on public.media_assets;
create policy own_media_metadata on public.media_assets for select to authenticated using(owner_user_id=auth.uid() and public.active_user());
drop policy notifications_own on public.notifications;
create policy notifications_own on public.notifications for select to authenticated using(user_id=auth.uid() and public.active_user());
grant execute on function public.active_user(),public.owns_customer(uuid),public.my_customer_profile() to authenticated;
revoke execute on function public.active_user(),public.owns_customer(uuid),public.my_customer_profile() from public;
commit;
