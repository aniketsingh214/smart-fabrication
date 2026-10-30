import { expect, it } from 'vitest';
import { advanceReceiptPdf } from '@/features/orders/advance-receipt-document';

it('renders a real advance payment receipt PDF for GateWala order', async () => {
  const buffer = await advanceReceiptPdf({
    order: {
      id: 'c5e62cb8-a704-4a13-b031-5126f2a74d31',
      name: 'Main Entrance Sliding Gate with Laser Cut Panel',
      status: 'ADVANCE_RECEIVED',
      total_minor: 4500000, // ₹45,000.00
      created_at: '2026-10-31T00:00:00Z',
    },
    customer: {
      name: 'Rajesh Sharma',
      phone: '+919826012345',
      email: 'rajesh.sharma@example.com',
      address: 'Plot 42, Green Valley Colony, Indore',
    },
    payment: {
      id: 'f87a3210-9b4c-4123-8899-abcdef012345',
      amount_minor: 1500000, // ₹15,000.00 (33.33% advance)
      mode: 'upi',
      reference: 'UPI/412389472911/GPay',
      created_at: '2026-10-31T01:00:00Z',
    },
    totalPaidMinor: 1500000,
    balanceDueMinor: 3000000, // ₹30,000.00
  });

  expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  expect(buffer.length).toBeGreaterThan(1500);
});

it('supports cash, bank and cheque payment modes in receipt PDF generation', async () => {
  for (const mode of ['cash', 'bank', 'cheque'] as const) {
    const buffer = await advanceReceiptPdf({
      order: {
        id: 'c5e62cb8-a704-4a13-b031-5126f2a74d31',
        name: 'Window Grills Set of 6',
        status: 'ADVANCE_RECEIVED',
        total_minor: 2500000,
        created_at: '2026-10-31T00:00:00Z',
      },
      customer: {
        name: 'Suresh Patel',
        phone: '+919425098765',
      },
      payment: {
        id: 'e1234567-89ab-cdef-0123-456789abcdef',
        amount_minor: 1000000,
        mode,
        reference: mode === 'cash' ? 'Voucher-101' : mode === 'bank' ? 'NEFT-AXIS001' : 'CHQ-882104',
        created_at: '2026-10-31T01:10:00Z',
      },
      totalPaidMinor: 1000000,
      balanceDueMinor: 1500000,
    });
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  }
});
