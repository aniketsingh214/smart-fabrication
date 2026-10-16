begin;
alter table public.quotations add column revision_of uuid unique references public.quotations(id),add column revision_key uuid unique,add column revision_reason text,add column revision_actor uuid references public.profiles(id);
alter table public.quotations drop constraint quotations_status_check;
alter table public.quotations add constraint quotations_status_check check(status in('draft','approved','accepted','rejected','expired','superseded'));
alter table public.quotations add constraint quotation_revision_metadata check((revision_of is null and revision_key is null and revision_reason is null and revision_actor is null) or(revision_of is not null and revision_key is not null and length(revision_reason) between 3 and 500 and revision_actor is not null));

create function public.guard_quotation_revision() returns trigger language plpgsql set search_path='' as $$begin
 if TG_OP='INSERT' then
  if new.revision_of is not null and current_user in('authenticated','anon') then raise exception 'Use quotation revision workflow';end if;
 elsif (new.revision_of,new.revision_key,new.revision_reason,new.revision_actor) is distinct from(old.revision_of,old.revision_key,old.revision_reason,old.revision_actor) then raise exception 'Revision provenance is immutable';end if;
 return new;end$$;
create trigger quotation_revision_provenance before insert or update on public.quotations for each row execute function public.guard_quotation_revision();

create function public.revise_quotation(target uuid,new_expiry timestamptz,reason text,request_key uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare original public.quotations;existing public.quotations;price public.quotation_versions;result uuid;
begin
 if not(public.has_permission('quotations.write') and public.has_permission('quotations.approve')) then raise insufficient_privilege;end if;
 if request_key is null then raise exception 'Idempotency key required';end if;
 perform pg_advisory_xact_lock(hashtextextended(request_key::text,0));
 select * into existing from public.quotations where revision_key=request_key;
 if found then
  if existing.revision_of is distinct from target or existing.expires_at is distinct from new_expiry or existing.revision_reason is distinct from reason or existing.revision_actor is distinct from auth.uid() then raise exception 'Idempotency key conflict';end if;
  return existing.id;
 end if;
 select * into original from public.quotations where id=target for update;if not found then raise no_data_found;end if;
 if original.status not in('approved','rejected','expired') then raise exception 'Only unaccepted issued quotations can be revised';end if;
 if new_expiry is null or new_expiry<=now() or reason is null or length(reason) not between 3 and 500 then raise exception 'Future expiry and revision summary required';end if;
 select * into price from public.quotation_versions where quotation_id=target order by version desc limit 1;if not found then raise exception 'Quotation has no price snapshot';end if;
 insert into public.quotations(name,lead_id,customer_id,expires_at,revision_of,revision_key,revision_reason,revision_actor)
 values(left(original.name,170)||' (revision)',original.lead_id,original.customer_id,new_expiry,target,request_key,reason,auth.uid()) returning id into result;
 insert into public.quotation_versions(quotation_id,version,snapshot,total_minor,currency) values(result,1,price.snapshot,price.total_minor,price.currency);
 update public.quotations set status='superseded' where id=target;
 return result;
end$$;
revoke execute on function public.guard_quotation_revision(),public.revise_quotation(uuid,timestamptz,text,uuid) from public;
grant execute on function public.revise_quotation(uuid,timestamptz,text,uuid) to authenticated;
commit;
