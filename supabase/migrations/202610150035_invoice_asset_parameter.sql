begin;
do $patch$
declare definition text;
begin
 select pg_get_functiondef('public.attach_purchase_invoice(uuid,uuid,text)'::regprocedure) into definition;
 if position('where id=asset_id for share' in definition)=0 then raise exception 'Unexpected invoice attachment definition';end if;
 definition:=replace(definition,'where id=asset_id for share','where id=$2 for share');
 execute definition;
end$patch$;
commit;
