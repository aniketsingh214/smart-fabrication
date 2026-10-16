import { describe,it,expect } from 'vitest';
import { safeInternalRedirect } from '@/contracts/redirect';
describe('Authentication return URL',()=>{
 it('preserves legitimate internal account/reset paths',()=>expect(safeInternalRedirect('/reset-password','http://localhost:3000').href).toBe('http://localhost:3000/reset-password'));
 it('rejects absolute, protocol-relative and backslash-based external redirects',()=>{for(const next of ['https://attacker.example','//attacker.example','/\\attacker.example','javascript:alert(1)'])expect(safeInternalRedirect(next,'http://localhost:3000').href).toBe('http://localhost:3000/account');});
 it('falls back for missing or malformed targets',()=>expect(safeInternalRedirect(null,'http://localhost:3000').pathname).toBe('/account'));
});
