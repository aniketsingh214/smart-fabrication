begin;
create table public.product_variants(id uuid primary key default gen_random_uuid(),product_id uuid not null references public.products(id),name text not null check(length(name) between 1 and 200),sku text not null unique,width_mm integer check(width_mm>0),height_mm integer check(height_mm>0),colour text not null default '',finish text not null default '',price_min_minor bigint not null default 0 check(price_min_minor>=0),price_max_minor bigint not null default 0, status text not null default 'draft' check(status in('draft','published','archived')),created_at timestamptz not null default now(),check(price_max_minor>=price_min_minor));
create table public.product_options(id uuid primary key default gen_random_uuid(),product_id uuid not null references public.products(id),name text not null check(length(name) between 1 and 200),option_group text not null check(length(option_group) between 1 and 100),extra_cost_minor bigint not null default 0 check(extra_cost_minor>=0),sort_order integer not null default 0,status text not null default 'draft' check(status in('draft','published','archived')),created_at timestamptz not null default now(),unique(product_id,option_group,name));
create table public.catalog_copies(id uuid primary key,source_id uuid not null references public.products(id),product_id uuid not null references public.products(id),actor_id uuid not null references public.profiles(id),request jsonb not null,created_at timestamptz not null default now());
do $$declare t text;begin
 foreach t in array array['product_variants','product_options'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy staff_read on public.%I for select to authenticated using(public.has_permission(''catalog.read''))',t);
  execute format('create policy staff_insert on public.%I for insert to authenticated with check(public.has_permission(''catalog.write''))',t);
  execute format('create policy staff_update on public.%I for update to authenticated using(public.has_permission(''catalog.write'')) with check(public.has_permission(''catalog.write''))',t);
  execute format('create policy public_published on public.%I for select to anon,authenticated using(status=''published'' and exists(select 1 from public.products p where p.id=product_id and p.status=''published''))',t);
  execute format('grant select on public.%I to anon,authenticated',t);execute format('grant insert,update on public.%I to authenticated',t);
  execute format('create trigger catalog_audit after insert or update on public.%I for each row execute function public.audit_change()',t);
  execute format('create index on public.%I(product_id,status)',t);
 end loop;
end$$;
alter table public.catalog_copies enable row level security;
create policy copies_read on public.catalog_copies for select to authenticated using(public.has_permission('catalog.read'));
grant select on public.catalog_copies to authenticated;
create trigger copies_immutable before update or delete on public.catalog_copies for each row execute function public.immutable_record();
create function public.duplicate_product(target uuid,payload jsonb,request_key uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare source public.products;prior public.catalog_copies;result uuid;begin
 if not public.has_permission('catalog.write') then raise insufficient_privilege;end if;
 if request_key is null then raise exception 'Idempotency key required';end if;
 if payload is null or jsonb_typeof(payload)<>'object' or length(coalesce(payload->>'name','')) not between 1 and 200 or length(coalesce(payload->>'sku','')) not between 1 and 100 or coalesce(payload->>'slug','') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(payload->>'slug')>200 then raise exception 'Valid name, SKU and slug required';end if;
 perform pg_advisory_xact_lock(hashtextextended(request_key::text,0));select * into prior from public.catalog_copies where id=request_key;
 if found then if prior.source_id is distinct from target or prior.actor_id is distinct from auth.uid() or prior.request is distinct from payload then raise exception 'Idempotency key conflict';end if;return prior.product_id;end if;
 select * into source from public.products where id=target for share;if not found then raise no_data_found;end if;
 insert into public.products(name,sku,slug,category_id,description,material,finish,price_min_minor,price_max_minor,custom_size,status) values(payload->>'name',payload->>'sku',payload->>'slug',source.category_id,source.description,source.material,source.finish,source.price_min_minor,source.price_max_minor,source.custom_size,'draft') returning id into result;
 insert into public.product_variants(product_id,name,sku,width_mm,height_mm,colour,finish,price_min_minor,price_max_minor,status) select result,name,(payload->>'sku')||'-V'||row_number() over(order by created_at,id),width_mm,height_mm,colour,finish,price_min_minor,price_max_minor,'draft' from public.product_variants where product_id=target and status<>'archived';
 insert into public.product_options(product_id,name,option_group,extra_cost_minor,sort_order,status) select result,name,option_group,extra_cost_minor,sort_order,'draft' from public.product_options where product_id=target and status<>'archived';
 insert into public.product_media(product_id,media_id,alt_text,sort_order) select result,media_id,alt_text,sort_order from public.product_media where product_id=target;
 insert into public.catalog_copies(id,source_id,product_id,actor_id,request) values(request_key,target,result,auth.uid(),payload);return result;
end$$;
revoke execute on function public.duplicate_product(uuid,jsonb,uuid) from public;
grant execute on function public.duplicate_product(uuid,jsonb,uuid) to authenticated;
commit;
