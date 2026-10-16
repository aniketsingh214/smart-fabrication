begin;
do $patch$
declare definition text;
begin
 select pg_get_functiondef('public.duplicate_product(uuid,jsonb,uuid)'::regprocedure) into definition;
 if position('category_id,description,material,finish' in definition)=0 or position('source.category_id,source.description,source.material' in definition)=0 then raise exception 'Unexpected product duplication definition';end if;
 definition:=replace(definition,'category_id,description,material,finish','category_id,description,weight_kg,design_code,design_details,material,finish');
 definition:=replace(definition,'source.category_id,source.description,source.material','source.category_id,source.description,source.weight_kg,source.design_code,source.design_details,source.material');
 execute definition;
end$patch$;
commit;
