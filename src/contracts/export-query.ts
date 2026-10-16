import { z } from 'zod';
import { reportPeriod } from './report-period';
export function exportQuery(params:URLSearchParams){return {limit:z.coerce.number().int().min(1).max(500).parse(params.get('limit')??500),cursor:params.get('cursor'),period:params.has('from')||params.has('until')?reportPeriod(params.get('from')??undefined,params.get('until')??undefined):null};}
export const reportDateFields:Record<string,string>={purchases:'bill_date',expenses:'expense_date','expense-reversals':'reversal_date','owner-withdrawals':'withdrawal_date','financial-adjustments':'posting_date','finance-period-closures':'closed_through'};
