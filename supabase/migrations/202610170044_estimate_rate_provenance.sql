-- New rate writes have a real creation instant even inside one transaction.
alter table public.material_rates alter column created_at set default clock_timestamp();
do $patch$ declare definition text;begin
 select pg_get_functiondef('public.estimate_product(uuid,numeric,numeric)'::regprocedure) into definition;
 if position('rate bigint;qty numeric' in definition)=0 or position('select selling_minor into rate' in definition)=0 or position('area=width_mm*height_mm/1000000;' in definition)=0 then raise exception 'Unexpected estimator definition';end if;
 definition:=replace(definition,'rate bigint;qty numeric','rate bigint;rate_id uuid;rate_effective timestamptz;qty numeric');
 definition:=replace(definition,'if width_mm not between','if width_mm is null or height_mm is null or width_mm not between');
 definition:=replace(definition,'area=width_mm*height_mm/1000000;',$guard$
 if exists(select 1 from public.bom_items bi join public.materials m on m.id=bi.material_id where bi.bom_id=bom.id and not m.active) then raise exception 'A configured material is inactive';end if;
 if exists(select 1 from public.products p where p.id=target and ((p.delivery_availability='unavailable' and rule.delivery_minor>0) or (p.installation_availability='unavailable' and rule.installation_minor>0))) then raise exception 'Pricing contains charges for an unavailable service';end if;
 area=width_mm*height_mm/1000000;$guard$);
 definition:=replace(definition,'select selling_minor into rate','select id,effective_at,selling_minor into rate_id,rate_effective,rate');
 definition:=replace(definition,'order by effective_at desc,created_at desc limit 1','order by effective_at desc,created_at desc,id desc limit 1');
 definition:=replace(definition,'''rate_effective_snapshot'',true','''rate_effective_snapshot'',true,''material_id'',line.material_id,''rate_id'',rate_id,''rate_effective_at'',rate_effective');
 execute definition;
end $patch$;
-- Formula arithmetic and previously issued result snapshots are unchanged.
notify pgrst,'reload schema';
