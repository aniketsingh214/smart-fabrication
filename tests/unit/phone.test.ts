import { describe,it,expect } from 'vitest';
import { formatIndianMobile,normalizeIndianMobile,indianMobileSchema } from '@/contracts/phone';
import { resourceMap,resourceSchema,leadSchema } from '@/contracts/resources';

describe('Indian mobile input and contact links',()=>{
 it.each(['9876543210','+919876543210','919876543210','09876543210','+91 98765 43210','98765-43210'])('normalizes %s without duplicating the country code',value=>{
  expect(indianMobileSchema.parse(value)).toBe('+919876543210');
  expect(formatIndianMobile(value)).toBe('+91 98765 43210');
 });
 it.each(['1234569872','5876543210','987654321','98765432101','+449876543210','+9109876543210','9876543210abc',''])('rejects invalid/mobile-incompatible input %s',value=>{
  expect(indianMobileSchema.safeParse(value).success).toBe(false);expect(normalizeIndianMobile(value)).toBeNull();
 });
 it('does not invent a country code or valid contact link for legacy invalid data',()=>{
  expect(formatIndianMobile('1234569872')).toBe('1234569872 (verify number)');
 });
 it('enforces the same normalization for public leads and admin customer updates',()=>{
  expect(leadSchema.parse({name:'Test customer',phone:'98765 43210',city:'Jhansi',requirement:'A custom steel gate'}).phone).toBe('+919876543210');
  const update=resourceSchema(resourceMap.customers!,true);
  expect(update.parse({phone:'9876543210'}).phone).toBe('+919876543210');
  expect(update.safeParse({phone:'1234569872'}).success).toBe(false);
  expect(update.parse({name:'Corrected name'})).toEqual({name:'Corrected name'});
 });
});
