import assert from 'node:assert/strict';
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:3000';
const samples=[],failures=[];
const targets=[['/api/v1/health',200],['/api/v1/admin/leads',401],['/catalog',200]];
// Deliberately bounded local acceptance exercise; no mutation/login endpoints.
for(const [path,status] of targets){const response=await fetch(base+path,{signal:AbortSignal.timeout(30000)});assert.equal(response.status,status,`Warmup ${path}`);await response.arrayBuffer();}
let next=0;const requests=60,concurrency=4;
await Promise.all(Array.from({length:concurrency},async()=>{
 while(next<requests){const index=next++,[path,expected]=targets[index%targets.length],start=performance.now();try{const response=await fetch(base+path,{signal:AbortSignal.timeout(20000)});await response.arrayBuffer();assert.equal(response.status,expected);samples.push(performance.now()-start);}catch(error){failures.push({path,message:error.message});}}
}));
samples.sort((a,b)=>a-b);
const result={recorded_at:new Date().toISOString(),scope:'Bounded local read-only smoke; not production capacity certification',requests,concurrency,passed:samples.length,failed:failures.length,p50_ms:Math.round(samples[Math.floor(samples.length*0.5)]??0),p95_ms:Math.round(samples[Math.min(samples.length-1,Math.floor(samples.length*0.95))]??0),failures};
fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/local-load.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
assert.equal(failures.length,0,'Local read-only load checks failed');
