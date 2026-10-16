begin;
create function public.finance_reconciliation() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare inventory jsonb;work_costs jsonb;purchase_tax jsonb;
begin
 if not public.has_permission('finance.read') then raise insufficient_privilege;end if;
 if public.has_permission('inventory.read') then
  with pools as(select material_id,sum(quantity) quantity,sum(coalesce(book_value_minor,round(quantity*unit_cost_minor))) value from public.stock_movements group by material_id)
  select jsonb_build_object('book_value_minor',coalesce(sum(value),0)::text,'material_pools',count(*),'negative_quantity_pools',count(*) filter(where quantity<0),'negative_value_pools',count(*) filter(where value<0),'legacy_movements',(select count(*) from public.stock_movements where book_value_minor is null)) into inventory from pools;
 end if;
 if public.has_permission('inventory.read') and public.has_permission('production.read') and public.has_permission('orders.read') and public.has_permission('workers.read') then
  with costs as(
   select w.order_id,-coalesce(s.book_value_minor,round(s.quantity*s.unit_cost_minor)) amount from public.stock_movements s left join public.work_orders w on w.id=s.work_order_id where s.kind='consumption'
   union all
   select w.order_id,e.amount_minor-coalesce(a.amount,0) from public.work_entries e join public.work_orders w on w.id=e.work_order_id left join(select source_id,sum(amount_minor) amount from public.financial_adjustments where kind='work_entry_reversal' group by source_id) a on a.source_id=e.id
  ),classified as(select c.amount,case when o.id is null then 'unallocated' when o.status='COMPLETED' then 'completed' when o.status='CANCELLED' then 'cancelled' else 'open' end bucket from costs c left join public.orders o on o.id=c.order_id)
  select jsonb_build_object('open_job_cost_minor',coalesce(sum(amount) filter(where bucket='open'),0)::text,'completed_job_cost_minor',coalesce(sum(amount) filter(where bucket='completed'),0)::text,'cancelled_job_cost_minor',coalesce(sum(amount) filter(where bucket='cancelled'),0)::text,'unallocated_cost_minor',coalesce(sum(amount) filter(where bucket='unallocated'),0)::text,'total_job_cost_minor',coalesce(sum(amount),0)::text) into work_costs from classified;
 end if;
 if public.has_permission('purchases.read') then
  with lines as(select i.id,i.tax_minor,i.tax_recoverable,round(i.tax_minor*least(coalesce(r.quantity,0),i.quantity)/i.quantity) return_tax from public.purchase_items i join public.purchases p on p.id=i.purchase_id left join(select purchase_item_id,sum(quantity) quantity from public.purchase_returns group by purchase_item_id) r on r.purchase_item_id=i.id where p.status='received')
  select jsonb_build_object('snapshot_tax_minor',coalesce(sum(tax_minor),0)::text,'estimated_return_tax_minor',coalesce(sum(return_tax),0)::text,'net_snapshot_tax_minor',coalesce(sum(tax_minor-return_tax),0)::text,'marked_recoverable_net_tax_minor',coalesce(sum(tax_minor-return_tax) filter(where tax_recoverable),0)::text,'capitalized_net_tax_minor',coalesce(sum(tax_minor-return_tax) filter(where not tax_recoverable),0)::text,'legacy_unpriced_lines',count(*) filter(where tax_minor is null)) into purchase_tax from lines;
 end if;
 return jsonb_build_object('as_of',statement_timestamp(),'currency','INR','scope','current_operational_snapshot','inventory',inventory,'job_costs',work_costs,'purchase_tax',purchase_tax,'official_accounts',false);
end$$;
revoke execute on function public.finance_reconciliation() from public,anon;
grant execute on function public.finance_reconciliation() to authenticated;
commit;
