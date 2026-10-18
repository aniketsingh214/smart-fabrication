-- Preserve existing public behavior; internal components can be hidden in new,
-- reviewed BOM versions without removing them from costing or staff history.
alter table public.bom_items add column customer_visible boolean not null default true;
do $patch$ declare definition text;begin
 select pg_get_functiondef('public.calculate_product_configuration(uuid,numeric,numeric,uuid,uuid,boolean)'::regprocedure) into definition;
 if position($before$'rate_effective_at',rate_effective$before$ in definition)=0 or position($before$return result||jsonb_build_object('id',snapshot_id);$before$ in definition)=0 then raise exception 'Unexpected shared estimator definition';end if;
 definition:=replace(definition,$before$'rate_effective_at',rate_effective$before$,$after$'rate_effective_at',rate_effective,'customer_visible',line.customer_visible$after$);
 definition:=replace(definition,$before$return result||jsonb_build_object('id',snapshot_id);$before$,$after$return result||jsonb_build_object('id',snapshot_id,'materials',(select coalesce(jsonb_agg(item order by position),'[]'::jsonb) from jsonb_array_elements(lines) with ordinality entries(item,position) where (item->>'customer_visible')::boolean));$after$);
 execute definition;
end $patch$;
notify pgrst,'reload schema';
