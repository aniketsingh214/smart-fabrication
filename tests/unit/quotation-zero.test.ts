import { expect, it } from 'vitest';

function sanitizeNumericString(val: string): string {
  if (val === '') return '';
  if (/^0+[1-9]/.test(val)) return val.replace(/^0+/, '');
  if (/^00+\./.test(val)) return val.replace(/^0+/, '0');
  if (/^0{2,}$/.test(val)) return '0';
  return val;
}

it('eliminates leading zero when a user types a digit after zero', () => {
  expect(sanitizeNumericString('05')).toBe('5');
  expect(sanitizeNumericString('007')).toBe('7');
  expect(sanitizeNumericString('0120')).toBe('120');
});

it('preserves single zero and decimals starting with zero', () => {
  expect(sanitizeNumericString('0')).toBe('0');
  expect(sanitizeNumericString('0.')).toBe('0.');
  expect(sanitizeNumericString('0.5')).toBe('0.5');
  expect(sanitizeNumericString('00.5')).toBe('0.5');
  expect(sanitizeNumericString('00')).toBe('0');
  expect(sanitizeNumericString('')).toBe('');
});

it('preserves normal positive integers and floating point values', () => {
  expect(sanitizeNumericString('4500')).toBe('4500');
  expect(sanitizeNumericString('12.50')).toBe('12.50');
  expect(sanitizeNumericString('100')).toBe('100');
});
