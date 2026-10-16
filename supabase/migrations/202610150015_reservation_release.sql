begin;
alter table public.stock_reservations add column release_note text not null default '';
alter table public.stock_reservations add column released_at timestamptz;
alter table public.stock_reservations add column released_by uuid references public.profiles(id);
create trigger audit_reservation after insert or update on public.stock_reservations for each row execute function public.audit_change();
create function public.release_reservation(target uuid,reason text) returns uuid language plpgsql security definer set search_path='' as $$declare item public.stock_reservations;material uuid;begin
 if not(public.has_permission('production.write') or public.has_permission('inventory.approve')) then raise insufficient_privilege;end if;if length(reason) not between 3 and 500 then raise exception 'Provide a release reason';end if;
 select material_id into material from public.stock_reservations where id=target;if not found then raise no_data_found;end if;perform 1 from public.materials where id=material for update;
 select * into item from public.stock_reservations where id=target for update;if item.status='released' then if item.release_note<>reason then raise exception 'Reservation already released with a different reason';end if;return target;end if;
 if item.status<>'active' then raise exception 'Consumed reservations cannot be released';end if;
 update public.stock_reservations set status='released',release_note=reason,released_at=now(),released_by=auth.uid() where id=target;return target;end$$;
grant execute on function public.release_reservation(uuid,text) to authenticated;
revoke execute on function public.release_reservation(uuid,text) from public;
commit;
