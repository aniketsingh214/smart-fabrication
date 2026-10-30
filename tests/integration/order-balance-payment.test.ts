import {afterEach,it,expect,vi} from 'vitest';
import {NextRequest} from 'next/server';
import {GET,POST} from '@/app/api/v1/orders/[id]/advance-payment/route';
import {requestContext} from '@/lib/auth/request';
vi.mock('@/lib/auth/request',()=>({requestContext:vi.fn()}));
afterEach(()=>vi.resetAllMocks());
const id='11111111-1111-4111-8111-111111111111',key='22222222-2222-4222-8222-222222222222';
function setup(status='COMPLETED'){
 const order={id,name:'Gate',status,total_minor:100000,version:7};
 const orderQuery={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),maybeSingle:vi.fn().mockResolvedValue({data:order,error:null})};
 const paymentQuery={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),order:vi.fn().mockResolvedValue({data:[{id:key,amount_minor:30000}],error:null})};
 const rpc=vi.fn((name:string)=>name==='receivable_balances'?{eq:vi.fn().mockResolvedValue({data:[{order_id:id,paid_minor:20000,outstanding_minor:80000}],error:null})}:Promise.resolve({data:key,error:null}));
 vi.mocked(requestContext).mockResolvedValue({db:{from:vi.fn((table:string)=>table==='orders'?orderQuery:paymentQuery),rpc}} as unknown as Awaited<ReturnType<typeof requestContext>>);return {rpc};
}
const params=()=>({params:Promise.resolve({id})});
const request=()=>new NextRequest('http://localhost/api/v1/orders/'+id+'/advance-payment',{method:'POST',headers:{'content-type':'application/json','Idempotency-Key':key},body:JSON.stringify({amount_minor:70000,mode:'upi',reference:'FINAL-001'})});
it('records a final payment on a completed order without changing its work stage and retains the retry key',async()=>{
 const {rpc}=setup();for(let attempt=0;attempt<2;attempt++)expect((await POST(request(),params())).status).toBe(201);
 expect(rpc.mock.calls.every(([name])=>name==='post_payment')).toBe(true);
 expect(rpc).toHaveBeenCalledWith('post_payment',expect.objectContaining({payload:expect.objectContaining({order_id:id,idempotency_key:key,amount_minor:70000})}));
});
it('uses net receivable balance after reviewed corrections rather than summing original receipts',async()=>{
 setup();const response=await GET(new NextRequest('http://localhost/api/v1/orders/'+id+'/advance-payment'),params());expect(response.status).toBe(200);expect((await response.json()).data).toMatchObject({totalPaidMinor:20000,balanceDueMinor:80000,status:'COMPLETED'});
});
it('keeps first payment advance transition for a confirmed order',async()=>{
 const {rpc}=setup('CONFIRMED');expect((await POST(request(),params())).status).toBe(201);expect(rpc).toHaveBeenCalledWith('transition_order',expect.objectContaining({target:id,next_status:'ADVANCE_RECEIVED',expected_version:7}));
});
