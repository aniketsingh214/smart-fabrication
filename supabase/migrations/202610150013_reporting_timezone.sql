begin;
-- Business dates use the workshop's India calendar; timestamp events remain UTC.
do $$declare definition text;begin
 select pg_get_functiondef('public.finance_summary(timestamptz,timestamptz)'::regprocedure) into definition;
 definition=replace(definition,'start_at::date','(start_at at time zone ''Asia/Kolkata'')::date');
 definition=replace(definition,'end_at::date','(end_at at time zone ''Asia/Kolkata'')::date');execute definition;
end$$;
-- Stable created-at pagination and time-filtered reports.
do $$declare t record;begin for t in select c.table_name from information_schema.columns c where c.table_schema='public' and c.column_name='created_at' and exists(select 1 from information_schema.columns i where i.table_schema='public' and i.table_name=c.table_name and i.column_name='id') loop execute format('create index if not exists %I on public.%I(created_at desc,id desc)',t.table_name||'_created_cursor_idx',t.table_name);end loop;end$$;
commit;
