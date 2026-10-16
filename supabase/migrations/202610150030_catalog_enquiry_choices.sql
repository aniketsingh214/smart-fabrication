begin;
alter table public.products add column weight_kg numeric(14,3) check(weight_kg>0 and weight_kg<=10000000);
alter table public.products add column design_code text not null default '' check(length(design_code)<=200);
alter table public.products add column design_details text not null default '' check(length(design_details)<=2000);
alter table public.leads add column configuration_snapshot jsonb not null default '{}'::jsonb check(jsonb_typeof(configuration_snapshot)='object');

-- The guest supplies IDs only. Published choices, names and indicative prices are
-- resolved inside the same transaction; the request cannot invent a price snapshot.
create or replace function public.submit_lead(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;previous uuid;days integer:=30;configured text;product uuid;variant uuid;options uuid[];snapshot jsonb:='{}';v jsonb;opts jsonb;
begin
 perform pg_advisory_xact_lock(731014);
 if payload->>'name' is null or length(payload->>'name') not between 2 and 120 or payload->>'phone' is null or(payload->>'phone')!~ '^\+?[0-9]{10,15}$' or payload->>'city' is null or length(payload->>'city') not between 2 and 100 or payload->>'requirement' is null or length(payload->>'requirement') not between 10 and 2000 then raise exception 'Invalid enquiry';end if;
 product:=nullif(payload->>'product_id','')::uuid;
 variant:=nullif(payload->>'selected_variant_id','')::uuid;
 if payload ? 'selected_option_ids' and jsonb_typeof(payload->'selected_option_ids')<>'array' then raise exception 'Invalid product options';end if;
 select coalesce(array_agg(value::uuid),'{}'::uuid[]) into options from jsonb_array_elements_text(coalesce(payload->'selected_option_ids','[]'::jsonb));
 if cardinality(options)>20 or cardinality(options)<>(select count(distinct x) from unnest(options) x) then raise exception 'Choose at most 20 distinct options';end if;
 if product is null and (variant is not null or cardinality(options)>0) then raise exception 'Product is required for selected choices';end if;
 if product is not null then
  perform 1 from public.products where id=product and status='published' for share;
  if not found then raise exception 'Product is unavailable';end if;
  if variant is not null then
   select jsonb_build_object('id',id,'name',name,'sku',sku,'width_mm',width_mm,'height_mm',height_mm,'colour',colour,'finish',finish,'price_min_minor',price_min_minor,'price_max_minor',price_max_minor) into v from public.product_variants where id=variant and product_id=product and status='published' for share;
   if not found then raise exception 'Variant is unavailable';end if;
  end if;
  perform 1 from public.product_options where id=any(options) and product_id=product and status='published' order by id for share;
  if (select count(*) from public.product_options where id=any(options) and product_id=product and status='published')<>cardinality(options) then raise exception 'Option is unavailable';end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'option_group',option_group,'extra_cost_minor',extra_cost_minor) order by sort_order,id),'[]'::jsonb) into opts from public.product_options where id=any(options) and product_id=product and status='published';
  snapshot:=jsonb_build_object('product_id',product,'variant',v,'options',opts,'pricing','indicative_only');
 end if;
 if(select count(*) from public.leads where phone=payload->>'phone' and created_at>now()-interval '1 hour')>=3 or(select count(*) from public.leads where created_at>now()-interval '1 hour')>=200 then raise exception 'Enquiry limit reached';end if;
 select value into configured from public.site_settings where name='lead_duplicate_days';if configured~'^[1-9][0-9]?$' then days=least(configured::integer,90);end if;
 select id into previous from public.leads where phone=payload->>'phone' and created_at>now()-make_interval(days=>days) order by created_at desc limit 1;
 insert into public.leads(name,phone,email,city,requirement,product_id,source,duplicate_of,configuration_snapshot) values(payload->>'name',payload->>'phone',nullif(payload->>'email',''),payload->>'city',payload->>'requirement',product,coalesce(payload->>'source','direct'),previous,snapshot) returning id into result;
 insert into public.lead_status_history(lead_id,to_status) values(result,'NEW');
 insert into public.notifications(user_id,name,body) select distinct user_id,'New enquiry','A new enquiry is ready for follow-up.' from public.user_roles where role_id in('owner','sales');return result;
end$$;
create function public.guard_lead_configuration() returns trigger language plpgsql set search_path='' as $$begin
 if old.configuration_snapshot is distinct from new.configuration_snapshot then raise exception 'Original enquiry configuration is immutable';end if;return new;
end$$;
create trigger immutable_lead_configuration before update on public.leads for each row execute function public.guard_lead_configuration();
revoke execute on function public.guard_lead_configuration() from public;
commit;
