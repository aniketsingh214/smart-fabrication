import { expect,it } from 'vitest';
import { loginDestination } from '@/contracts/login-destination';
it('lands customers in their account and staff in a permitted workspace',()=>{
 expect(loginDestination([])).toBe('/account');
 expect(loginDestination(['leads.read'])).toBe('/admin');
 expect(loginDestination(['catalog.read'])).toBe('/admin/workspaces/catalog');
 expect(loginDestination(['users.read'])).toBe('/admin/workspaces/settings');
 expect(loginDestination(['reports.read'])).toBe('/admin/reports');
 expect(loginDestination(['unrelated.write'])).toBe('/account');
});
