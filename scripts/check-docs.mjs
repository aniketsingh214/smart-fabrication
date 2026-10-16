import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const errors=[];
const excluded=new Set(['.git','node_modules','.next','coverage','test-results','playwright-report']);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>excluded.has(e.name)?[]:e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=walk(root);
for(const file of files.filter(f=>f.endsWith('.md')&&!f.endsWith('MASTER_PLAN.md')&&!f.endsWith('SmartFabrication_Master_Plan.md'))){
  const text=fs.readFileSync(file,'utf8').replace(/```[\s\S]*?```/g,'');
  for(const [,link] of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
    if(/^(https?:|mailto:|#)/.test(link))continue;
    if(!fs.existsSync(path.resolve(path.dirname(file),link.split('#')[0])))errors.push(`${path.relative(root,file)}: broken link ${link}`);
  }
}
const requirements=JSON.parse(fs.readFileSync(path.join(root,'docs/traceability.json'),'utf8'));
if(requirements.length!==34||new Set(requirements.map(r=>r.id)).size!==34)errors.push('Expected 34 unique requirements');
for(let n=1;n<=20;n++)if(!fs.existsSync(path.join(root,`docs/phases/phase-${String(n).padStart(2,'0')}.md`)))errors.push(`Missing phase ${n}`);
const master=fs.readFileSync(path.join(root,'docs/MASTER_PLAN.md'));
const original=fs.readFileSync(path.join(root,'docs/source/SmartFabrication_Master_Plan.md'));
if(!master.equals(original))errors.push('Master plan and preserved source differ');
const count=[...master.toString('utf8').matchAll(/^### 5\.\d+ /gm)].length;
const modules=files.filter(f=>f.startsWith(path.join(root,'docs/modules')+path.sep)&&f.endsWith('.md')).length;
if(modules!==count)errors.push(`Expected ${count} module documents, found ${modules}`);
const api=fs.readFileSync(path.join(root,'docs/api/openapi.yaml'),'utf8');
if(!api.startsWith('openapi: 3.1.0\n'))errors.push('Expected OpenAPI 3.1 contract; run api:check for semantic validation');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`PASS: local documentation links, 34 unique requirements, 20 phases, ${modules} module baselines, byte-identical master source.`);
console.log(`Source SHA-256: ${crypto.createHash('sha256').update(master).digest('hex')}`);
console.log('Documentation checks only. Run api:check and the runtime/test gates separately.');
