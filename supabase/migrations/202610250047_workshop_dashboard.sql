begin;
-- Read-only classification of explicit markers used by the shipped acceptance
-- scripts. This does not certify unmarked rows as genuine business transactions.
create function public.dashboard_demo_marker(label text, email text default null)
returns boolean language sql immutable set search_path='' as $$
 select coalesce(label ~* '^TEST ONLY([ -]|$)',false)
 or coalesce(email ~* '@example[.]invalid$',false)
 or coalesce(label ~* '^(Finance (Lead|Quote)|Delivery (Lead|Quotation)|Reminder Lead|Delivery for Order|Installation for Delivery) [0-9a-f]{8}$',false)
$$;

create function public.workshop_dashboard(requested_scope text default 'business',requested_task text default 'all',requested_page integer default 1)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb; instant timestamptz:=now(); day_start timestamptz;day_end timestamptz;
 lead_access boolean:=public.has_permission('leads.read');quote_access boolean:=public.has_permission('quotations.read');
 order_access boolean:=public.has_permission('orders.read');delivery_access boolean:=public.has_permission('delivery.read');
begin
 if not public.active_user() or not(lead_access or quote_access or order_access or delivery_access) then raise insufficient_privilege;end if;
 if requested_scope not in('business','demo','all') or requested_task not in('all','new','followup','approval','delivery') or requested_page not between 1 and 10000 then raise exception 'Invalid dashboard filter';end if;
 day_start:=((instant at time zone 'Asia/Kolkata')::date)::timestamp at time zone 'Asia/Kolkata';day_end:=day_start+interval '1 day';
 with
 lead_source as (select l.*,public.dashboard_demo_marker(l.name,l.email) demo from public.leads l where lead_access),
 l as (select * from lead_source where requested_scope='all' or demo=(requested_scope='demo')),
 f as (select fu.id,fu.due_at,fu.status,l.name from public.follow_ups fu join l on l.id=fu.lead_id where fu.status='pending' and l.status not in('LOST','COMPLETED')),
 quote_source as (select q.*,public.dashboard_demo_marker(q.name,c.email) demo from public.quotations q left join public.customers c on c.id=q.customer_id where quote_access),
 q as (select * from quote_source where requested_scope='all' or demo=(requested_scope='demo')),
 approvals as (select * from q where status='draft' and expires_at>instant and exists(select 1 from public.quotation_versions v where v.quotation_id=q.id)),
 order_source as (select o.*,public.dashboard_demo_marker(o.name,c.email) demo from public.orders o left join public.customers c on c.id=o.customer_id where order_access and o.status<>'CANCELLED'),
 o as (select * from order_source where requested_scope='all' or demo=(requested_scope='demo')),
 delivery_source as (select d.*,public.dashboard_demo_marker(d.name) or public.dashboard_demo_marker(parent.name,c.email) demo from public.deliveries d left join public.orders parent on parent.id=d.order_id left join public.customers c on c.id=parent.customer_id where delivery_access),
 d as (select * from delivery_source where requested_scope='all' or demo=(requested_scope='demo')),
 i as (select ins.id from public.installations ins join d on d.id=ins.delivery_id where ins.status='pending'),
 tasks as (
 select 'new' kind,id,name title,created_at due_at,status,2 priority,'Contact customer' action,'/admin/leads?record='||id href from l where status='NEW'
 union all select 'followup',id,name,due_at,status,case when due_at<instant then 0 else 1 end,'Follow up','/admin/follow-ups?record='||id from f where due_at<day_end
 union all select 'approval',id,name,expires_at,status,2,'Review draft quotation','/admin/quotations?record='||id from approvals
 union all select 'delivery',id,name,scheduled_at,status,1,'Review delivery and crew','/admin/deliveries?record='||id from d where status in('scheduled','dispatched') and scheduled_at>=day_start and scheduled_at<day_end
 ),
 matching as (select * from tasks where requested_task='all' or kind=requested_task),
 task_page as (select * from matching order by priority,due_at,id offset (requested_page-1)*10 limit 10),
 staged as (select id,name,status,due_at,case when status in('CONFIRMED','ADVANCE_RECEIVED','MEASUREMENT_CONFIRMED','PRODUCTION_PENDING') then 'confirmed' when status in('PRODUCTION_STARTED','FABRICATION_COMPLETED','FINISHING') then 'production' when status='READY' then 'ready' when status in('OUT_FOR_DELIVERY','INSTALLATION') then 'delivery' when status='COMPLETED' then 'completed' end stage from o),
 stages as (select key,ordinality position from unnest(array['confirmed','production','ready','delivery','completed']) with ordinality as stage(key,ordinality) where order_access),
 board as (select s.key,(select count(*) from staged x where x.stage=s.key) count,coalesce((select jsonb_agg(to_jsonb(sample)) from (select id,name,status,due_at,'/admin/orders?record='||id href from staged x where x.stage=s.key order by due_at nulls last,id limit 3) sample),'[]'::jsonb) items,s.position from stages s),
 events as (
 select id,name title,'Enquiry received' label,created_at happened_at,'/admin/leads?record='||id href from l
 union all select h.id,o.name,'Order: '||replace(h.to_status,'_',' '),h.created_at,'/admin/orders?record='||o.id from public.order_status_history h join o on o.id=h.order_id
 union all select id,name,'Quotation created',created_at,'/admin/quotations?record='||id from q
 ),recent as (select * from events order by happened_at desc,id desc limit 6)
 select jsonb_build_object(
 'as_of',instant,'day_start',day_start,'day_end',day_end,'scope',requested_scope,'task',requested_task,'page',requested_page,'page_size',10,
 'metrics',jsonb_build_object(
 'new_leads',case when lead_access then (select count(*) from l where status='NEW') end,
 'active_leads',case when lead_access then (select count(*) from l where status not in('LOST','COMPLETED')) end,
 'followups_due',case when lead_access then (select count(*) from f where due_at<day_end) end,
 'overdue_followups',case when lead_access then (select count(*) from f where due_at<instant) end,
 'approvals',case when quote_access then (select count(*) from approvals) end,
 'open_orders',case when order_access then (select count(*) from o where status<>'COMPLETED') end,
 'deliveries_today',case when delivery_access then (select count(*) from d where status in('scheduled','dispatched') and scheduled_at>=day_start and scheduled_at<day_end) end,
 'pending_installations',case when delivery_access then (select count(*) from i) end),
 'task_total',(select count(*) from matching),
 'tasks',coalesce((select jsonb_agg(to_jsonb(task_page) order by priority,due_at,id) from task_page),'[]'::jsonb),
 'board',coalesce((select jsonb_agg(jsonb_build_object('key',key,'count',count,'items',items) order by position) from board),'[]'::jsonb),
 'activity',coalesce((select jsonb_agg(to_jsonb(recent) order by happened_at desc,id desc) from recent),'[]'::jsonb)
 ) into result;
 return result;
end$$;
revoke all on function public.dashboard_demo_marker(text,text),public.workshop_dashboard(text,text,integer) from public,anon;
grant execute on function public.dashboard_demo_marker(text,text),public.workshop_dashboard(text,text,integer) to authenticated;
commit;
