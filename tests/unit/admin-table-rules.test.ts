import { describe, expect, it } from 'vitest';
import { resourceMap, resources } from '@/contracts/resources';
import { canEditRecord, parseRecordForm, removalPatch } from '@/features/operations/table-rules';

const resource=(slug:string)=>resourceMap[slug]!;
function form(values:Record<string,string>){const data=new FormData();for(const [key,value] of Object.entries(values))data.set(key,value);return data;}
describe('admin list safety and validation',()=>{
 it('requires the actual resource write permission',()=>{expect(canEditRecord(resource('products'),['catalog.read'])).toBe(false);expect(canEditRecord(resource('products'),['catalog.write'])).toBe(true);});
 it('never edits immutable resources even with all write permissions',()=>{const grants=resources.map(row=>row.writePermission??row.domain+'.write');for(const row of resources.filter(row=>row.readOnly||row.appendOnly||row.rpc||['measurements','labour-rates'].includes(row.slug)))expect(canEditRecord(row,grants)).toBe(false);});
 it('only allows draft document editing',()=>{for(const slug of ['quotations','purchases','expenses','bom-versions','calculation-rules']){const row=resource(slug),grants=[row.writePermission??row.domain+'.write'];expect(canEditRecord(row,grants,{status:'draft'})).toBe(true);expect(canEditRecord(row,grants,{status:'approved'})).toBe(false);}});
 it('removes listings through reversible archive/deactivation only',()=>{expect(removalPatch(resource('products'))).toEqual({status:'archived'});expect(removalPatch(resource('categories'))).toEqual({active:false});expect(removalPatch(resource('reviews'))).toEqual({status:'hidden'});for(const slug of ['orders','customer-payments','purchases','stock-movements','audit-logs','bom-versions'])expect(removalPatch(resource(slug))).toBeNull();});
 it('normalizes trimmed text and checkbox state through the shared schema',()=>{const result=parseRecordForm(resource('categories'),form({name:'  Gate  ',slug:'gate',sort_order:'0',active:'on'}));expect(result.errors).toEqual({});expect(result.payload).toMatchObject({name:'Gate',active:true,sort_order:0,parent_id:null});});
 it('reports invalid slugs, missing required values and numbers beside their fields',()=>{const {errors}=parseRecordForm(resource('categories'),form({name:'  ',slug:'Bad Slug',sort_order:'NaN'}));expect(Object.keys(errors)).toEqual(expect.arrayContaining(['name','slug','sort_order']));});
 it('catches malformed JSON with a useful field error',()=>{const result=parseRecordForm(resource('installations'),form({checklist:'{bad'}));expect(result.errors.checklist).toBe('Enter a valid JSON object');});
 it('rejects JSON arrays when the API expects an object',()=>{expect(parseRecordForm(resource('installations'),form({checklist:'[]'})).errors.checklist).toBeTruthy();});
 it('rejects excessive review ratings and inverted price bounds',()=>{expect(parseRecordForm(resource('reviews'),form({name:'Buyer',rating:'6',body:'Review',status:'pending'})).errors.rating).toBeTruthy();expect(parseRecordForm(resource('products'),form({price_min_minor:'200',price_max_minor:'100'})).errors.price_max_minor).toBe('Maximum price must cover starting price');});
 it('retains rupee precision and accepts Indian mobile normalization',()=>{expect(parseRecordForm(resource('customer-payments'),form({amount_minor:'123.45'})).payload.amount_minor).toBe(12345);expect(parseRecordForm(resource('workers'),form({name:'Worker',phone:'98765 43210',work_type:'Welding',active:'on'})).payload.phone).toBe('+919876543210');});
});
