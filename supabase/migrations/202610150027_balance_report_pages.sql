begin;
create function public.finance_balance_page(report_name text,after_id uuid default null,page_limit integer default 25) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare rows jsonb;result jsonb;count_rows integer;take integer;begin
 if not public.has_permission('finance.read') then raise insufficient_privilege;end if;take=greatest(1,least(page_limit,100));
 if report_name='receivables' then
  if not public.has_permission('orders.read') then raise insufficient_privilege;end if;
  select coalesce(jsonb_agg(to_jsonb(t) order by t.order_id),'[]') into rows from(select * from public.receivable_balances() where after_id is null or order_id>after_id order by order_id limit take+1)t;
 elsif report_name='payables' then
  if not public.has_permission('purchases.read') then raise insufficient_privilege;end if;
  select coalesce(jsonb_agg(to_jsonb(t) order by t.purchase_id),'[]') into rows from(select * from public.payable_balances() where after_id is null or purchase_id>after_id order by purchase_id limit take+1)t;
 elsif report_name='workers' then
  if not public.has_permission('workers.read') then raise insufficient_privilege;end if;
  select coalesce(jsonb_agg(to_jsonb(t) order by t.worker_id),'[]') into rows from(select * from public.worker_balances() where after_id is null or worker_id>after_id order by worker_id limit take+1)t;
 else raise exception 'Unknown balance report';end if;
 count_rows=jsonb_array_length(rows);
 select coalesce(jsonb_agg(value order by n),'[]') into result from jsonb_array_elements(rows) with ordinality x(value,n) where n<=take;
 return jsonb_build_object('items',result,'next_id',case when count_rows>take then coalesce(result->(take-1)->>'order_id',result->(take-1)->>'purchase_id',result->(take-1)->>'worker_id') end);
end$$;
revoke execute on function public.finance_balance_page(text,uuid,integer) from public;
grant execute on function public.finance_balance_page(text,uuid,integer) to authenticated;
commit;
