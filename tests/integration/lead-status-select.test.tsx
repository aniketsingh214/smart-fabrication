import { expect,it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LeadStatusSelect } from '@/features/leads/status-select';
it('shows all pipeline stages but only permits the guarded next stage',()=>{const html=renderToStaticMarkup(<LeadStatusSelect lead={{id:'fixture',name:'Fixture',status:'NEW',version:1}} busy={false} onChange={()=>{}}/>);for(const label of ['New','Contacted','Requirement Confirmed','Measurement Pending','Measurement Done','Quotation Sent','Negotiation','Order Confirmed'])expect(html).toContain(label);expect(html).toMatch(/value="CONTACTED"/);expect(html).toMatch(/value="ORDER_CONFIRMED" disabled/);expect(html).toContain('Lead status for Fixture');});
