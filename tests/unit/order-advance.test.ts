import { expect, it } from 'vitest';
import { z } from 'zod';

const advancePaymentSchema = z.object({
  amount_minor: z.number().int().positive('Payment amount must be greater than zero'),
  mode: z.enum(['cash', 'bank', 'upi', 'cheque']),
  reference: z.string().trim().min(1, 'Reference or transaction ID is required').max(200),
  gateway_ready: z.boolean().optional().default(false),
});

it('validates manual payment modes and positive integer minor amount', () => {
  const result = advancePaymentSchema.safeParse({
    amount_minor: 1500000,
    mode: 'upi',
    reference: 'UPI/412389472911',
    gateway_ready: true,
  });
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.amount_minor).toBe(1500000);
    expect(result.data.mode).toBe('upi');
    expect(result.data.gateway_ready).toBe(true);
  }
});

it('rejects invalid or non-positive amount and unsupported mode', () => {
  expect(
    advancePaymentSchema.safeParse({
      amount_minor: 0,
      mode: 'cash',
      reference: 'Ref 1',
    }).success
  ).toBe(false);

  expect(
    advancePaymentSchema.safeParse({
      amount_minor: 500,
      mode: 'crypto',
      reference: 'Ref 1',
    }).success
  ).toBe(false);

  expect(
    advancePaymentSchema.safeParse({
      amount_minor: 500,
      mode: 'upi',
      reference: '',
    }).success
  ).toBe(false);
});

it('calculates balance due correctly after advance payment', () => {
  const totalMinor = 4500000; // ₹45,000
  const advanceMinor = 1500000; // ₹15,000
  const balanceMinor = Math.max(0, totalMinor - advanceMinor);
  expect(balanceMinor).toBe(3000000); // ₹30,000
  expect(Math.round((advanceMinor / totalMinor) * 100)).toBe(33);
});
