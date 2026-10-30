import {it,expect} from 'vitest';
import {resourceMap,resourceSchema} from '@/contracts/resources';
const resource=resourceMap['follow-ups']!;
it('accepts every follow-up workflow status for creation and editing',()=>{
 for(const status of ['pending','processing','working','delay','completed']){
  expect(resourceSchema(resource).safeParse({lead_id:'11111111-1111-4111-8111-111111111111',due_at:'2026-10-31T10:00:00+05:30',note:'Check requirement',status}).success).toBe(true);
  expect(resourceSchema(resource,true).safeParse({status}).success).toBe(true);
 }
 expect(resourceSchema(resource,true).safeParse({status:'invalid'}).success).toBe(false);
});
