import { describe, it, expect } from 'vitest';
import { estimatePdf } from '@/features/estimates/estimate-pdf-document';

describe('estimatePdf generation', () => {
  it('renders a real indicative estimate PDF for GateWala designs', async () => {
    const buffer = await estimatePdf({
      productName: 'Royal Laser Cut Double Door Main Gate',
      widthMm: 3048,
      heightMm: 1829,
      widthFtIn: '10 ft 0 in',
      heightFtIn: '6 ft 0 in',
      areaSqFt: '60.0',
      areaSqM: '5.57',
      weightKg: 145,
      minMinor: 3800000,
      maxMinor: 4600000,
      materials: [
        { name: 'MS Square Pipe 50x50mm 16G', quantity: 6, unit: 'lengths', amount_minor: 1200000 },
        { name: 'CNC Laser Cut Sheet 2.0mm', quantity: 1, unit: 'sheet', amount_minor: 1500000 },
        { name: 'Heavy Ball Bearing Hinges & Hardware', quantity: 1, unit: 'set', amount_minor: 350000 }
      ],
      notice: 'Indicative estimate. Final quote subject to physical measurement.'
    });

    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(1000);

    // Verify it is a valid PDF binary buffer
    const header = buffer.subarray(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');
  });

  it('handles empty material list cleanly with default fallback row', async () => {
    const buffer = await estimatePdf({
      productName: 'Modern Stainless Steel Balcony Railing',
      widthMm: 2400,
      heightMm: 900,
      widthFtIn: '7 ft 10 in',
      heightFtIn: '2 ft 11 in',
      areaSqFt: '23.2',
      areaSqM: '2.16',
      weightKg: 42,
      minMinor: 1850000,
      maxMinor: 2200000,
      materials: []
    });

    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(1000);
    const header = buffer.subarray(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');
  });
});
