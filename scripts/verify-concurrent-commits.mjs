import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import pg from 'pg';
export async function verifyConcurrentCommits(connectionString,owner){
 const url=new URL(connectionString);assert.equal(url.hostname,'127.0.0.1');assert.match(url.pathname,/^\/sf_restore_[a-f0-9_]+$/);
 const first=new pg.Client({connectionString}),second=new pg.Client({connectionString});let checks=0;
 const rpc=async(client,name,args)=>{const {rows}=await client.query(`select public.${name}(${args.map((_,index)=>`$${index+1}`).join(',')}) result`,args.map(value=>value!==null&&typeof value==='object'?JSON.stringify(value):value));return rows[0].result;};
 async function oneWinner(name,left,right){const result=await Promise.allSettled([left(),right()]);assert.equal(result.filter(item=>item.status==='fulfilled').length,1,name);const failure=result.find(item=>item.status==='rejected');assert.ok(['P0001','23514'].includes(failure.reason.code),`${name}: unexpected rejection`);checks++;console.log(`PASS: ${name}`);}
 try{
  await Promise.all([first.connect(),second.connect()]);
  for(const client of [first,second]){await client.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);await client.query('set role authenticated');await client.query("set statement_timeout='15s'");}
  const {rows:materials}=await first.query("insert into public.materials(name,code,type,size,thickness_mm,unit,weight_kg_per_unit) values('Concurrent fixture',$1,'square_pipe','25mm',2,'kg',1) returning id",[crypto.randomUUID()]);const material=materials[0].id;
  const movement=(quantity,key=crypto.randomUUID())=>({material_id:material,quantity,unit_cost_minor:100,kind:'adjustment',note:'Isolated concurrent commit fixture',idempotency_key:key});
  await rpc(first,'post_stock',[movement(100)]);
  await oneWinner('Committed competing stock deductions cannot oversell',()=>rpc(first,'post_stock',[movement(-70)]),()=>rpc(second,'post_stock',[movement(-70)]));
  const {rows:balances}=await first.query('select sum(quantity)::text quantity from public.stock_movements where material_id=$1',[material]);assert.equal(Number(balances[0].quantity),30);checks++;
  const duplicate=movement(5);const ids=await Promise.all([rpc(first,'post_stock',[duplicate]),rpc(second,'post_stock',[duplicate])]);assert.equal(ids[0],ids[1]);const {rows:retries}=await first.query('select count(*)::integer count from public.stock_movements where idempotency_key=$1',[duplicate.idempotency_key]);assert.equal(retries[0].count,1);checks++;console.log('PASS: Concurrent committed retries create exactly one stock entry');
  const {rows:customers}=await first.query("insert into public.customers(name,phone) values('Concurrent customer','919876000044') returning id");
  const {rows:quotes}=await first.query("insert into public.quotations(name,customer_id,expires_at) values('Concurrent payment fixture',$1,now()+interval '1 day') returning id",[customers[0].id]);
  await rpc(first,'make_quotation_version',[quotes[0].id,[{description:'Synthetic gate',quantity:1,unit_minor:10000}],0,0]);await rpc(first,'approve_quotation',[quotes[0].id]);await rpc(first,'respond_quotation',[quotes[0].id,true]);const order=await rpc(first,'convert_quotation',[quotes[0].id]);
  const payment=()=>({order_id:order,amount_minor:6000,mode:'bank',reference:crypto.randomUUID(),idempotency_key:crypto.randomUUID()});
  await oneWinner('Committed competing customer receipts cannot exceed the order balance',()=>rpc(first,'post_payment',['customer',payment()]),()=>rpc(second,'post_payment',['customer',payment()]));
  const {rows:paid}=await first.query('select sum(amount_minor)::text amount from public.customer_payments where order_id=$1',[order]);assert.equal(Number(paid[0].amount),6000);checks++;
  const receipt={order_id:order,amount_minor:2000,mode:'bank',reference:crypto.randomUUID(),idempotency_key:crypto.randomUUID()};const receiptIds=await Promise.all([rpc(first,'post_payment',['customer',receipt]),rpc(second,'post_payment',['customer',receipt])]);assert.equal(receiptIds[0],receiptIds[1]);const {rows:receiptRows}=await first.query('select count(*)::integer count from public.customer_payments where idempotency_key=$1',[receipt.idempotency_key]);assert.equal(receiptRows[0].count,1);checks++;console.log('PASS: Concurrent committed receipt retries create one payment');
  const {rows:suppliers}=await first.query("insert into public.suppliers(name,phone) values('Concurrent supplier','919876000045') returning id");
  const {rows:purchases}=await first.query("insert into public.purchases(name,supplier_id,bill_number,bill_date) values('Concurrent refund fixture',$1,$2,(now() at time zone 'Asia/Kolkata')::date) returning id",[suppliers[0].id,crypto.randomUUID()]);const purchase=purchases[0].id;
  const {rows:items}=await first.query('insert into public.purchase_items(purchase_id,material_id,quantity,rate_minor) values($1,$2,10,1000) returning id',[purchase,material]);await rpc(first,'receive_purchase',[purchase]);await rpc(first,'post_payment',['supplier',{purchase_id:purchase,amount_minor:10000,mode:'bank',reference:crypto.randomUUID(),idempotency_key:crypto.randomUUID()}]);await rpc(first,'return_purchase_item',[{purchase_item_id:items[0].id,quantity:10,reason:'Synthetic paid return',idempotency_key:crypto.randomUUID()}]);
  const {rows:dates}=await first.query("select (now() at time zone 'Asia/Kolkata')::date::text as business_day");
  const refund=()=>({kind:'supplier_refund',source_id:purchase,posting_date:dates[0].business_day,amount_minor:6000,mode:'bank',reference:crypto.randomUUID(),reason:'Synthetic concurrent refund',confirmed:true,idempotency_key:crypto.randomUUID()});
  await oneWinner('Committed competing refunds cannot exceed the supplier credit',()=>rpc(first,'post_financial_adjustment',[refund()]),()=>rpc(second,'post_financial_adjustment',[refund()]));
  const {rows:refunded}=await first.query("select sum(amount_minor)::text amount from public.financial_adjustments where purchase_id=$1 and kind='supplier_refund'",[purchase]);assert.equal(Number(refunded[0].amount),6000);checks++;
  const refundRetry={...refund(),amount_minor:2000};const refundIds=await Promise.all([rpc(first,'post_financial_adjustment',[refundRetry]),rpc(second,'post_financial_adjustment',[refundRetry])]);assert.equal(refundIds[0],refundIds[1]);const {rows:refundRows}=await first.query('select count(*)::integer count from public.financial_adjustments where idempotency_key=$1',[refundRetry.idempotency_key]);assert.equal(refundRows[0].count,1);checks++;console.log('PASS: Concurrent committed refund retries create one correction');
  const {rows:jobs}=await first.query("insert into public.work_orders(name,order_id) values('Concurrent reserve A',$1),('Concurrent reserve B',$1) returning id",[order]);
  await oneWinner('Committed competing reservations cannot allocate more than available stock',()=>rpc(first,'reserve_stock',[{work_order_id:jobs[0].id,material_id:material,quantity:20}]),()=>rpc(second,'reserve_stock',[{work_order_id:jobs[1].id,material_id:material,quantity:20}]));
  const {rows:reserved}=await first.query("select sum(quantity-consumed_quantity)::text quantity from public.stock_reservations where material_id=$1 and status='active'",[material]);assert.equal(Number(reserved[0].quantity),20);checks++;
  console.log(`PASS: ${checks} isolated concurrent-commit assertions. Synthetic local database only.`);return checks;
 }finally{await Promise.allSettled([first.end(),second.end()]);}
}

