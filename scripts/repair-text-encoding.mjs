import fs from 'node:fs';
import path from 'node:path';
// Repair UTF-8 text previously read as Windows-1252. Preserve source-document bytes and secrets.
const root=path.resolve(import.meta.dirname,'..'),skip=new Set(['.git','.next','node_modules','test-results','playwright-report','coverage','source']);
const cp=new TextDecoder('windows-1252'),utf8=new TextDecoder('utf-8',{fatal:true}),bytes=new Map();
for(let n=0;n<256;n++)bytes.set(cp.decode(Uint8Array.of(n)),n);
function repair(text){let current=text;for(let pass=0;pass<8;pass++){const chars=Array.from(current),out=[];let changed=false;for(let i=0;i<chars.length;i++){const first=bytes.get(chars[i]),size=first>=0xc2&&first<=0xdf?2:first>=0xe0&&first<=0xef?3:first>=0xf0&&first<=0xf4?4:0;if(size&&i+size<=chars.length){const seq=chars.slice(i,i+size).map(c=>bytes.get(c));if(seq.slice(1).every(b=>b>=0x80&&b<=0xbf)){try{out.push(utf8.decode(Uint8Array.from(seq)));i+=size-1;changed=true;continue;}catch{/* A real non-UTF8 sequence is left unchanged. */}}}out.push(chars[i]);}current=out.join('');if(!changed)break;}return current;}
const changed=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(skip.has(e.name)||e.name.startsWith('.env')||e.name==='MASTER_PLAN.md')continue;const file=path.join(dir,e.name);if(e.isDirectory())walk(file);else if(/\.(tsx?|mjs|md|json|ya?ml)$/.test(e.name)&&e.name!=='package-lock.json'){const original=fs.readFileSync(file,'utf8'),fixed=repair(original);if(fixed!==original){fs.writeFileSync(file,fixed);changed.push(path.relative(root,file));}}}}
walk(root);console.log(JSON.stringify({repairedFiles:changed},null,2));
