import SwaggerParser from '@apidevtools/swagger-parser';
import fs from 'node:fs';
import path from 'node:path';
const api=await SwaggerParser.validate('docs/api/openapi.yaml');
const root=path.resolve('src/app/api/v1');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
let methods=0;
for(const file of walk(root).filter(f=>f.endsWith('route.ts')&&!f.includes('[...segments]'))){
 const parts=path.relative(root,path.dirname(file)).split(path.sep);
 const pattern=new RegExp('^/'+parts.map(p=>p.startsWith('[')?'[^/]+':p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('/')+'$');
 const source=fs.readFileSync(file,'utf8');
 for(const [,method] of source.matchAll(/export\s+(?:async\s+function|const)\s+(GET|POST|PATCH|PUT|DELETE|HEAD|OPTIONS)\b/g)){
  const documented=Object.entries(api.paths).some(([route,item])=>pattern.test(route)&&item?.[method.toLowerCase()]);
  if(!documented)throw new Error(`Missing OpenAPI contract: ${method} ${parts.join('/')}`);methods++;
 }
}
console.log(`PASS: OpenAPI ${api.openapi}, ${Object.keys(api.paths).length} documented paths.`);
console.log(`PASS: ${methods} explicit Route Handler methods have matching OpenAPI paths (catch-all resources are generated from the resource registry).`);
