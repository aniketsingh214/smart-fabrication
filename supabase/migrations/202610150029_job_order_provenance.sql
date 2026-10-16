begin;
do $$declare definition text;begin
 select pg_get_functiondef('public.guard_cancelled_order_work()'::regprocedure) into definition;
 definition=replace(definition,'if TG_TABLE_NAME=''work_orders'' then target_order=new.order_id;',
 'if TG_TABLE_NAME=''work_orders'' then if TG_OP=''UPDATE'' then if old.order_id is distinct from new.order_id then raise exception ''Work order provenance is immutable; create a separate job'';end if;end if;target_order=new.order_id;');
 if position('Work order provenance is immutable' in definition)=0 then raise exception 'Job guard upgrade did not match baseline';end if;execute definition;
end$$;
commit;
