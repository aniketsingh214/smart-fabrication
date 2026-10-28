import { expect,it } from 'vitest';
import { safeReturnPath } from '@/lib/return-path';
it('preserves local quotation and admin targets',()=>{expect(safeReturnPath('/account?quotation=abc#quotation-abc')).toBe('/account?quotation=abc#quotation-abc');expect(safeReturnPath('/admin/quotations?record=abc')).toBe('/admin/quotations?record=abc');});
it('rejects external, protocol-relative, backslash, control and unrelated destinations',()=>{for(const value of ['https://evil.invalid','//evil.invalid','/account/../../login','/contact','/administer','/account'+String.fromCharCode(92)+'evil','/admin'+String.fromCharCode(10)+'evil'])expect(safeReturnPath(value)).toBe('/account');});
