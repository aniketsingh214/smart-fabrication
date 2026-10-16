import { describe,it,expect } from 'vitest';
import { indiaDate,reportPeriod } from '@/contracts/report-period';
import { csvCell } from '@/features/reports/csv';
describe('India reporting boundaries',()=>{
 it('uses the India calendar day independently of host timezone',()=>expect(indiaDate(new Date('2026-10-14T18:30:00Z'))).toBe('2026-10-15'));
 it('uses an inclusive India end date and exclusive UTC upper boundary',()=>expect(reportPeriod('2026-10-01','2026-10-15')).toMatchObject({start:'2026-09-30T18:30:00.000Z',end:'2026-10-15T18:30:00.000Z'}));
 it('rejects reversed and unbounded reporting intervals',()=>{expect(()=>reportPeriod('2026-10-15','2026-10-01')).toThrow();expect(()=>reportPeriod('2020-01-01','2026-10-15')).toThrow();});
 it('escapes formulas even after leading whitespace',()=>{expect(csvCell('  =1+1')).toBe('"\'  =1+1"');expect(csvCell('\tformula')).toBe('"\'\tformula"');});
});
