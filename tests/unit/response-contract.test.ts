import fs from 'node:fs';
import YAML from 'yaml';
import { expect,it } from 'vitest';
// This checked-in generated contract deliberately reuses schemas across 285 paths.
const api=YAML.parse(fs.readFileSync('docs/api/openapi.yaml','utf8'),{maxAliasCount:100000});
it('documents resource arrays with continuation in meta, matching the HTTP handler',()=>{
 const resource=api.paths['/admin/products'].get.responses[200].content['application/json'].schema;
 expect(resource.properties.data.type).toBe('array');
 expect(resource.properties.meta.properties.nextCursor.type).toEqual(['string','null']);
 expect(resource.properties.data.items.$ref).toBe('#/components/schemas/products_record');
 const detail=api.paths['/admin/products/{id}'].get.responses[200].content['application/json'].schema;
 expect(detail.properties.data.$ref).toBe('#/components/schemas/products_record');
});
it('generates nullable typed read fields without exposing unprojected keys',()=>{
 const product=api.components.schemas.products_record;
 expect(product.additionalProperties).toBe(false);
 expect(product.properties.weight_kg.anyOf).toEqual([{type:'number'},{type:'null'}]);
 expect(product.properties.id).toEqual({type:'string',format:'uuid'});
 expect(product.properties.price_min_minor.type).toBe('integer');
 expect(api.components.schemas.stock_movements_record.properties).not.toHaveProperty('idempotency_key');
});
