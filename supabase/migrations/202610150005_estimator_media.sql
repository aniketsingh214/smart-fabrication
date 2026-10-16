begin;
create table public.calculation_rules(id uuid primary key default gen_random_uuid(),product_id uuid not null references public.products(id),version integer not null check(version>0),labour_minor_per_sq_m bigint not null check(labour_minor_per_sq_m>=0),finish_minor_per_sq_m bigint not null check(finish_minor_per_sq_m>=0),hardware_minor bigint not null check(hardware_minor>=0),delivery_minor bigint not null check(delivery_minor>=0),installation_minor bigint not null check(installation_minor>=0),margin_bps integer not null check(margin_bps between 0 and 10000),range_percent integer not null check(range_percent between 0 and 50),status text not null default 'draft' check(status in('draft','published','archived')),created_at timestamptz not null default now(),unique(product_id,version));
alter table public.calculation_rules enable row level security;
create policy rules_read on public.calculation_rules for select to authenticated using(public.has_permission('materials.read'));
create policy rules_insert on public.calculation_rules for insert to authenticated with check(public.has_permission('materials.write'));
create policy rules_update on public.calculation_rules for update to authenticated using(public.has_permission('materials.write')) with check(public.has_permission('materials.write'));
grant select,insert,update on public.calculation_rules to authenticated;
create function public.pricing_rule_guard() returns trigger language plpgsql set search_path='' as $$begin if old.status='published' then raise exception 'Published pricing rule is immutable';end if;return new;end$$;
create trigger immutable_pricing_rule before update on public.calculation_rules for each row execute function public.pricing_rule_guard();
create function public.estimate_product(target uuid,width_mm numeric,height_mm numeric) returns jsonb language plpgsql security definer set search_path='' as $$declare bom public.bom_versions;rule public.calculation_rules;line record;rate bigint;qty numeric;area numeric;weight numeric:=0;material_total bigint:=0;labour bigint;finish bigint;total bigint;result jsonb;lines jsonb:='[]';snapshot_id uuid;begin
 if width_mm not between 100 and 20000 or height_mm not between 100 and 10000 then raise exception 'Dimensions are outside supported range';end if;
 perform pg_advisory_xact_lock(731015);
 if(select count(*) from public.estimate_snapshots where created_at>now()-interval '1 hour')>=1000 then raise exception 'Estimate limit reached';end if;
 if not exists(select 1 from public.products where id=target and status='published') then raise no_data_found;end if;
 select * into bom from public.bom_versions where product_id=target and status='published' order by version desc limit 1;if not found then raise exception 'No published material configuration';end if;
 select * into rule from public.calculation_rules where product_id=target and status='published' order by version desc limit 1;if not found then raise exception 'No published pricing configuration';end if;
 area=width_mm*height_mm/1000000;
 for line in select b.*,m.name,m.unit,m.weight_kg_per_unit from public.bom_items b join public.materials m on m.id=b.material_id and m.active where b.bom_id=bom.id loop
  select selling_minor into rate from public.material_rates where material_id=line.material_id and effective_at<=now() order by effective_at desc,created_at desc limit 1;if rate is null then raise exception 'A configured material has no current rate';end if;
  qty=round(area*line.quantity_per_sq_m*(1+line.wastage_percent/100),4);weight=weight+qty*line.weight_kg_per_unit;material_total=material_total+round(qty*rate)::bigint;
  lines=lines||jsonb_build_array(jsonb_build_object('name',line.name,'quantity',qty,'unit',line.unit,'weight_kg',round(qty*line.weight_kg_per_unit,3),'rate_minor',rate,'amount_minor',round(qty*rate),'rate_effective_snapshot',true));
 end loop;
 if jsonb_array_length(lines)=0 then raise exception 'Material configuration is empty';end if;
 labour=round(area*rule.labour_minor_per_sq_m);finish=round(area*rule.finish_minor_per_sq_m);
 total=material_total+labour+finish+rule.hardware_minor+rule.delivery_minor+rule.installation_minor;total=total+round(total::numeric*rule.margin_bps/10000)::bigint;
 if total>9000000000000 then raise exception 'Estimate exceeds supported value';end if;
 result=jsonb_build_object('approximate',true,'currency','INR','area_sq_m',round(area,4),'weight_kg',round(weight,3),'materials',lines,'material_minor',material_total,'labour_minor',labour,'finish_minor',finish,'hardware_minor',rule.hardware_minor,'delivery_minor',rule.delivery_minor,'installation_minor',rule.installation_minor,'total_minor',total,'min_minor',round(total*(1-rule.range_percent::numeric/100)),'max_minor',round(total*(1+rule.range_percent::numeric/100)),'formula_version','area-bom-v1','bom_version',bom.version,'rule_version',rule.version,'notice','Approximate estimate only. Final price requires verified measurement and approved quotation.');
 insert into public.estimate_snapshots(product_id,bom_id,input,result,formula_version) values(target,bom.id,jsonb_build_object('width_mm',width_mm,'height_mm',height_mm),result,'area-bom-v1') returning id into snapshot_id;
 return result||jsonb_build_object('id',snapshot_id);end$$;
grant execute on function public.estimate_product(uuid,numeric,numeric) to anon,authenticated;
revoke execute on function public.estimate_product(uuid,numeric,numeric),public.pricing_rule_guard() from public;

create table public.upload_intents(id uuid primary key,owner_user_id uuid not null references public.profiles(id),public_id text not null unique,context text not null check(context in('product','gallery','customer_design','delivery_proof','invoice')),visibility text not null check(visibility in('public','private')),expires_at timestamptz not null,confirmed_at timestamptz,created_at timestamptz not null default now());
alter table public.upload_intents enable row level security;
create policy upload_intents_read on public.upload_intents for select to authenticated using(owner_user_id=auth.uid() or public.has_permission('media.read'));
revoke insert,update on public.media_assets from authenticated;
grant select on public.upload_intents to authenticated;
commit;
