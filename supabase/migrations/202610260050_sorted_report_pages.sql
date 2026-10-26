begin;
-- Read-only sorted paging. Invoker rights and original domain guards remain mandatory.
create function public.sorted_report_page(report_name text,sort_key text,sort_direction text,page_offset integer default 0,page_limit integer default 25,target uuid default null)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare source text;sort_expression text;rows jsonb;take integer;result jsonb;begin
 if report_name='staff' then
  if not public.has_permission('users.read') then raise insufficient_privilege;end if;
 else
  if not public.has_permission('finance.read') then raise insufficient_privilege;end if;
 end if;
 if sort_direction not in('asc','desc') or page_offset<0 or page_offset>100000 then raise exception 'Invalid sort page';end if;
 take=greatest(1,least(page_limit,100));
 if report_name='staff' then
  source='select jsonb_build_object(''id'',p.id,''display_name'',p.display_name,''disabled'',p.disabled,''created_at'',p.created_at,''user_roles'',coalesce(r.grants,''[]''::jsonb),''roles'',r.roles,''sort_id'',p.id) row from public.profiles p left join lateral(select jsonb_agg(jsonb_build_object(''role_id'',u.role_id) order by u.role_id) grants,string_agg(u.role_id,'', '' order by u.role_id) roles from public.user_roles u where u.user_id=p.id) r on true';
 elsif report_name='receivables' then
  if not public.has_permission('orders.read') then raise insufficient_privilege;end if;
  source='select to_jsonb(t)||jsonb_build_object(''sort_id'',t.order_id) row from public.receivable_balances() t';
 elsif report_name='payables' then
  if not public.has_permission('purchases.read') then raise insufficient_privilege;end if;
  source='select to_jsonb(t)||jsonb_build_object(''sort_id'',t.purchase_id) row from public.payable_balances() t';
 elsif report_name='workers' then
  if not public.has_permission('workers.read') then raise insufficient_privilege;end if;
  source='select to_jsonb(t)||jsonb_build_object(''sort_id'',t.worker_id) row from public.worker_balances() t';
 elsif report_name='statement' then
  if not(public.has_permission('suppliers.read') and public.has_permission('purchases.read')) then raise insufficient_privilege;end if;
  if not exists(select 1 from public.suppliers where id=target) then raise no_data_found;end if;
  source='with posted as(select * from public.purchases where supplier_id=$1 and status=''received''), events as(
   select id,''invoice''::text kind,created_at,bill_number reference,total_minor::numeric delta_minor from posted
   union all select r.id,''return'',r.created_at,r.reason,-r.amount_minor::numeric from public.purchase_returns r join public.purchase_items i on i.id=r.purchase_item_id join posted p on p.id=i.purchase_id
   union all select s.id,''payment'',s.created_at,s.reference,-s.amount_minor::numeric from public.supplier_payments s join posted p on p.id=s.purchase_id
   union all select a.id,a.kind,a.created_at,a.reference,a.amount_minor::numeric from public.financial_adjustments a join posted p on p.id=a.purchase_id where a.kind in(''supplier_refund'',''supplier_payment_reversal'')
  ) select to_jsonb(e)||jsonb_build_object(''sort_id'',e.id::text||e.kind) row from events e';
 else raise exception 'Unknown report';end if;
 if report_name='staff' then
  if sort_key<>'roles' then raise exception 'Invalid staff sort';end if;
 elsif report_name='statement' then
  if sort_key not in('created_at','kind','reference','delta_minor') then raise exception 'Invalid statement sort';end if;
 else
  if sort_key not in('name','total_minor','earned_minor','paid_minor','returned_minor','outstanding_minor') then raise exception 'Invalid balance sort';end if;
 end if;
 sort_expression=format('row->>%L',sort_key);
 if sort_key like '%_minor' then sort_expression='('||sort_expression||')::numeric';end if;
 execute 'select coalesce(jsonb_agg(row order by n),''[]''::jsonb) from(select row,row_number() over(order by '||sort_expression||' '||sort_direction||' nulls last,row->>''sort_id'' asc) n from('||source||') s order by '||sort_expression||' '||sort_direction||' nulls last,row->>''sort_id'' asc offset $2 limit $3) p' into rows using target,page_offset,take+1;
 select coalesce(jsonb_agg(value-'sort_id' order by n),'[]') into result from jsonb_array_elements(rows) with ordinality x(value,n) where n<=take;
 return jsonb_build_object('items',result,'next_offset',case when jsonb_array_length(rows)>take then page_offset+take end);
end$$;
revoke all on function public.sorted_report_page(text,text,text,integer,integer,uuid) from public,anon;
grant execute on function public.sorted_report_page(text,text,text,integer,integer,uuid) to authenticated;
commit;
