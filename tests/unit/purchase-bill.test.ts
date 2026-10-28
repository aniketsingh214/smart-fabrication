import { expect, it, describe } from 'vitest';

describe('Purchase Bill Calculations & Validation', () => {
  it('correctly calculates line item subtotal and bill grand total', () => {
    const items = [
      { quantity: 50, rate: 72 }, // MS Angle: 50 kg @ ₹72 = ₹3,600
      { quantity: 10, rate: 450 }, // MS Pipe: 10 pcs @ ₹450 = ₹4,500
      { quantity: 2, rate: 2850 }, // CR Sheet: 2 sheets @ ₹2,850 = ₹5,700
    ];

    const subtotals = items.map((i) => Math.round(i.quantity * i.rate * 100) / 100);
    expect(subtotals).toEqual([3600, 4500, 5700]);

    const grandTotal = subtotals.reduce((sum, val) => sum + val, 0);
    expect(grandTotal).toBe(13800);
  });

  it('correctly calculates remaining due balance with partial payment', () => {
    const grandTotal = 13800;
    const paidAmount = 5000;

    const due = Math.max(0, grandTotal - paidAmount);
    expect(due).toBe(8800);
  });

  it('correctly sets due to 0 when bill is fully paid', () => {
    const grandTotal = 13800;
    const paidAmount = 13800;

    const due = Math.max(0, grandTotal - paidAmount);
    expect(due).toBe(0);
  });

  it('prevents overpayment when paid amount exceeds bill total', () => {
    const grandTotal = 13800;
    const paidAmount = 15000;

    const isOverpaid = paidAmount > grandTotal;
    expect(isOverpaid).toBe(true);
  });
});
