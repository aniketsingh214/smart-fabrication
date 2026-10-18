import fs from 'node:fs/promises';
import { databaseClient } from './db-client.mjs';
const db=databaseClient();
try{
 await db.connect();await db.query('begin isolation level repeatable read read only');await db.query("set local statement_timeout='20s'");
 const {rows:[counts]}=await db.query("select (select count(*)::integer from public.materials where active) active_materials,(select count(*)::integer from public.material_rates) rate_versions,(select count(*)::integer from public.products where status='published') published_products");
 const {rows}=await db.query(`select p.id,p.name,b.version bom_version,r.version rule_version,p.delivery_availability,p.installation_availability,
 r.delivery_minor::text,r.installation_minor::text,l.items,l.inactive,l.missing_rates
 from public.products p
 left join lateral(select id,version from public.bom_versions where product_id=p.id and status='published' order by version desc limit 1)b on true
 left join lateral(select version,delivery_minor,installation_minor from public.calculation_rules where product_id=p.id and status='published' order by version desc limit 1)r on true
 left join lateral(select count(*)::integer items,count(*)filter(where not m.active)::integer inactive,
 count(*)filter(where not exists(select 1 from public.material_rates mr where mr.material_id=m.id and mr.effective_at<=now()))::integer missing_rates
 from public.bom_items bi join public.materials m on m.id=bi.material_id where bi.bom_id=b.id)l on true
 where p.status='published' order by p.id`);
 const problems=[];let configured=0;
 for(const row of rows){const issues=[];if(!row.bom_version)issues.push('missing published BOM');if(!row.rule_version)issues.push('missing published pricing rule');if(!row.items)issues.push('empty BOM');if(row.inactive)issues.push('inactive BOM material');if(row.missing_rates)issues.push('missing effective rate');for(const service of ['delivery','installation'])if(row[service+'_availability']==='unavailable'&&BigInt(row[service+'_minor']??0)>0n)issues.push('unavailable '+service+' has configured charge');if(issues.length)problems.push({product_id:row.id,name:row.name,issues});else configured++;}
 await db.query('commit');const report={recorded_at:new Date().toISOString(),read_only:true,...counts,configured_products:configured,products_with_issues:problems.length,issues:problems.slice(0,100),issues_truncated:problems.length>100,has_published_configuration:rows.length>0&&configured===rows.length,workshop_approval:'Must be recorded by the business; never inferred from populated rows',scope:'Configuration presence/consistency only; no rates or formulas are invented or changed'};
 await fs.mkdir('test-results',{recursive:true});await fs.writeFile('test-results/calculation-readiness.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(error){await db.query('rollback').catch(()=>{});console.error('Calculation readiness audit failed: '+error.message);process.exitCode=1;}finally{await db.end().catch(()=>{});}
