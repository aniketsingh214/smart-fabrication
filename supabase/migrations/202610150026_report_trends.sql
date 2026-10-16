begin;
create function public.report_trends(start_at timestamptz,end_at timestamptz) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;begin
 if not public.has_permission('reports.read') then raise insufficient_privilege;end if;
 if start_at is null or end_at is null or end_at<=start_at or end_at-start_at>interval '366 days' then raise exception 'Invalid reporting interval';end if;
 select jsonb_build_object(
 'leads_by_source',case when public.has_permission('leads.read') then coalesce((select jsonb_agg(to_jsonb(t)) from(select source label,count(*)::int value from public.leads where created_at>=start_at and created_at<end_at group by source order by count(*) desc,source)t),'[]'::jsonb) end,
 'leads_by_product',case when public.has_permission('leads.read') then coalesce((select jsonb_agg(to_jsonb(t)) from(select coalesce(p.name,'Unspecified / unavailable product') label,count(*)::int value from public.leads l left join public.products p on p.id=l.product_id where l.created_at>=start_at and l.created_at<end_at group by coalesce(p.name,'Unspecified / unavailable product') order by count(*) desc,1 limit 10)t),'[]'::jsonb) end,
 'orders_by_month',case when public.has_permission('orders.read') then coalesce((select jsonb_agg(to_jsonb(t) order by label) from(select to_char(created_at at time zone 'Asia/Kolkata','YYYY-MM') label,count(*)::int value from public.orders where created_at>=start_at and created_at<end_at group by 1)t),'[]'::jsonb) end,
 'purchases_by_month',case when public.has_permission('purchases.read') then coalesce((select jsonb_agg(to_jsonb(t) order by label) from(select to_char(bill_date,'YYYY-MM') label,sum(total_minor) value from public.purchases where status='received' and bill_date>=(start_at at time zone 'Asia/Kolkata')::date and bill_date<(end_at at time zone 'Asia/Kolkata')::date group by 1)t),'[]'::jsonb) end,
 'net_customer_cash_by_month',case when public.has_permission('finance.read') then coalesce((select jsonb_agg(to_jsonb(t) order by label) from(select label,sum(amount) value from(select to_char(created_at at time zone 'Asia/Kolkata','YYYY-MM') label,amount_minor::numeric amount from public.customer_payments where created_at>=start_at and created_at<end_at union all select to_char(posting_date,'YYYY-MM'),-amount_minor::numeric from public.financial_adjustments where kind in('customer_payment_reversal','customer_refund') and posting_date>=(start_at at time zone 'Asia/Kolkata')::date and posting_date<(end_at at time zone 'Asia/Kolkata')::date)e group by label)t),'[]'::jsonb) end
 ) into result;return result;
end$$;
revoke execute on function public.report_trends(timestamptz,timestamptz) from public;
grant execute on function public.report_trends(timestamptz,timestamptz) to authenticated;
commit;
