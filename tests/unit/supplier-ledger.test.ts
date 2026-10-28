import { expect, it, describe } from 'vitest';

describe('Supplier Ledger & Balance Allocation', () => {
  it('correctly calculates chronological running balance from ledger events', () => {
    // Chronological order: Bill 1 -> Payment -> Bill 2 -> Payment
    const events = [
      { kind: 'invoice', reference: 'Bill #101', delta_minor: 1200000 }, // +₹12,000
      { kind: 'payment', reference: 'UPI Payment', delta_minor: -700000 }, // -₹7,000 (Balance = ₹5,000)
      { kind: 'invoice', reference: 'Bill #102', delta_minor: 800000 },  // +₹8,000 (Balance = ₹13,000)
      { kind: 'payment', reference: 'Cash Payment', delta_minor: -300000 }, // -₹3,000 (Balance = ₹10,000)
    ];

    let runningBalance = 0;
    const computed = events.map((e) => {
      runningBalance += e.delta_minor;
      return runningBalance;
    });

    expect(computed).toEqual([1200000, 500000, 1300000, 1000000]);
  });

  it('correctly allocates a single payment across multiple unpaid bills in FIFO order', () => {
    const unpaidBills = [
      { purchase_id: 'p-1', bill_number: '101', outstanding_minor: 500000 }, // ₹5,000 due
      { purchase_id: 'p-2', bill_number: '102', outstanding_minor: 1000000 }, // ₹10,000 due
    ];

    let paymentAmountMinor = 700000; // ₹7,000 paid

    const allocations: Array<{ purchase_id: string; allocated_minor: number }> = [];

    for (const bill of unpaidBills) {
      if (paymentAmountMinor <= 0) break;
      const allocate = Math.min(paymentAmountMinor, bill.outstanding_minor);
      allocations.push({ purchase_id: bill.purchase_id, allocated_minor: allocate });
      paymentAmountMinor -= allocate;
    }

    expect(allocations).toEqual([
      { purchase_id: 'p-1', allocated_minor: 500000 }, // Bill 101 settled with ₹5,000
      { purchase_id: 'p-2', allocated_minor: 200000 }, // Bill 102 credited with ₹2,000
    ]);
    expect(paymentAmountMinor).toBe(0);
  });
});
