import { z } from 'zod';
const amount=z.string().regex(/^-?\d+$/);
const count=z.number().int().nonnegative();
export const reconciliationSchema=z.object({
 as_of:z.iso.datetime({offset:true}),currency:z.literal('INR'),scope:z.literal('current_operational_snapshot'),official_accounts:z.literal(false),
 inventory:z.object({book_value_minor:amount,material_pools:count,negative_quantity_pools:count,negative_value_pools:count,legacy_movements:count}).nullable(),
 job_costs:z.object({open_job_cost_minor:amount,completed_job_cost_minor:amount,cancelled_job_cost_minor:amount,unallocated_cost_minor:amount,total_job_cost_minor:amount}).nullable(),
 purchase_tax:z.object({snapshot_tax_minor:amount,estimated_return_tax_minor:amount,net_snapshot_tax_minor:amount,marked_recoverable_net_tax_minor:amount,capitalized_net_tax_minor:amount,legacy_unpriced_lines:count}).nullable(),
});
/** Exact INR display, including aggregate values beyond Number.MAX_SAFE_INTEGER. */
export function exactRupees(value:string){
 if(!/^-?\d+$/.test(value))throw new Error('Expected integer minor units');
 const zero=BigInt(0),hundred=BigInt(100),total=BigInt(value),absolute=total<zero?-total:total;
 return `${total<zero?'-':''}₹${(absolute/hundred).toLocaleString('en-IN')}.${String(absolute%hundred).padStart(2,'0')}`;
}
