-- One calculator implementation serves public issued snapshots and private,
-- non-persisted draft previews; formula arithmetic must not diverge.
do $patch$ declare definition text;begin
 select pg_get_functiondef('public.estimate_product(uuid,numeric,numeric)'::regprocedure) into definition;
 if position('insert into public.estimate_snapshots' in definition)=0 or position('rate_effective_at' in definition)=0 then raise exception 'Unexpected estimator definition';end if;
 definition:=regexp_replace(definition,'public\.estimate_product\([^)]*\)','public.calculate_product_configuration(target uuid, width_mm numeric, height_mm numeric, selected_bom uuid, selected_rule uuid, draft_preview boolean)');
 definition:=replace(definition,'if(select count(*) from public.estimate_snapshots','if not draft_preview and(select count(*) from public.estimate_snapshots');
 definition:=replace(definition,$before$if not exists(select 1 from public.products where id=target and status='published') then raise no_data_found;end if;$before$,$after$
 if draft_preview and (not public.has_permission('materials.read') or not public.has_permission('catalog.read')) then raise insufficient_privilege;end if;
 if not exists(select 1 from public.products where id=target and (status='published' or (draft_preview and status='draft'))) then raise no_data_found;end if;$after$);
 definition:=replace(definition,'from public.bom_versions where product_id=target and status=''published''','from public.bom_versions where product_id=target and ((draft_preview and id=selected_bom and status in(''draft'',''published'')) or (not draft_preview and status=''published''))');
 definition:=replace(definition,'from public.calculation_rules where product_id=target and status=''published''','from public.calculation_rules where product_id=target and ((draft_preview and id=selected_rule and status in(''draft'',''published'')) or (not draft_preview and status=''published''))');
 definition:=replace(definition,'insert into public.estimate_snapshots','if draft_preview then return result||jsonb_build_object(''preview'',true);end if;insert into public.estimate_snapshots');
 execute definition;
end $patch$;
revoke all on function public.calculate_product_configuration(uuid,numeric,numeric,uuid,uuid,boolean) from public,anon,authenticated,service_role;
create or replace function public.estimate_product(target uuid,width_mm numeric,height_mm numeric) returns jsonb
language sql security definer set search_path='' as $$select public.calculate_product_configuration(target,width_mm,height_mm,null,null,false)$$;
create function public.preview_estimate_product(target uuid,selected_bom uuid,selected_rule uuid,width_mm numeric,height_mm numeric) returns jsonb
language sql security definer set search_path='' as $$select public.calculate_product_configuration(target,width_mm,height_mm,selected_bom,selected_rule,true)$$;
revoke all on function public.preview_estimate_product(uuid,uuid,uuid,numeric,numeric) from public,anon;
grant execute on function public.preview_estimate_product(uuid,uuid,uuid,numeric,numeric) to authenticated;
notify pgrst,'reload schema';
