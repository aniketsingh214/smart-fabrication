begin;
create table public.purchase_attachments(id uuid primary key default gen_random_uuid(),purchase_id uuid not null references public.purchases(id),media_id uuid not null unique references public.media_assets(id),note text not null default '' check(length(note)<=500),created_by uuid not null references public.profiles(id),created_at timestamptz not null default now());
create index purchase_attachments_page on public.purchase_attachments(purchase_id,id);
alter table public.purchase_attachments enable row level security;
create policy invoice_attachment_read on public.purchase_attachments for select to authenticated using(public.has_permission('purchases.read') and public.has_permission('finance.read'));
revoke all on public.purchase_attachments from anon;
revoke insert,update,delete,truncate,references,trigger on public.purchase_attachments from authenticated;
grant select on public.purchase_attachments to authenticated;
create trigger purchase_attachment_immutable before update or delete on public.purchase_attachments for each row execute function public.immutable_record();
create trigger purchase_attachment_audit after insert on public.purchase_attachments for each row execute function public.audit_change();
create function public.attach_purchase_invoice(target uuid,asset_id uuid,attachment_note text default '') returns uuid language plpgsql security definer set search_path='' as $$
declare media public.media_assets;prior public.purchase_attachments;result uuid;
begin
 if not public.has_permission('purchases.write') or not public.has_permission('finance.read') then raise insufficient_privilege;end if;
 if attachment_note is null or length(attachment_note)>500 then raise exception 'Invalid invoice note';end if;
 perform 1 from public.purchases where id=target for update;if not found then raise no_data_found;end if;
 select * into media from public.media_assets where id=asset_id for share;
 if not found or media.context<>'invoice' or media.visibility<>'private' or media.resource_type<>'image' or not exists(select 1 from public.upload_intents where public_id=media.public_id and confirmed_at is not null) then raise exception 'A verified private invoice image is required';end if;
 if media.owner_user_id is distinct from auth.uid() and not public.has_permission('finance.approve') then raise insufficient_privilege;end if;
 -- Serialize the same asset across different purchases before inspecting provenance.
 perform pg_advisory_xact_lock(hashtextextended(asset_id::text,32));
 select * into prior from public.purchase_attachments where media_id=asset_id;
 if found then if prior.purchase_id<>target or prior.note<>attachment_note or prior.created_by<>auth.uid() then raise exception 'Invoice attachment conflict';end if;return prior.id;end if;
 insert into public.purchase_attachments(purchase_id,media_id,note,created_by) values(target,asset_id,attachment_note,auth.uid()) returning id into result;return result;
end$$;
revoke execute on function public.attach_purchase_invoice(uuid,uuid,text) from public,anon;
grant execute on function public.attach_purchase_invoice(uuid,uuid,text) to authenticated;
commit;
