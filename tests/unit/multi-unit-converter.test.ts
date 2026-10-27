import { describe, it, expect } from 'vitest';
import {
  convertPurchaseToStock,
  reconcileKantaWeight,
} from '@/features/materials/multi-unit-converter';

describe('Multi-Unit Procurement Converter', () => {
  const samplePipe = {
    unit: 'piece' as const,
    weight_kg_per_unit: 5.4, // 25x25 18G pipe = 5.4 kg
    standard_length_m: 6.0,
    shape: 'square',
  };

  it('converts bundle purchases to pieces and calculates approximate weight', () => {
    // 5 bundles of pipe (4 pcs per bundle) = 20 pieces
    const result = convertPurchaseToStock(5, 'bundle', samplePipe, 4);
    expect(result.canonicalQuantity).toBe(20);
    expect(result.canonicalUnit).toBe('piece');
    expect(result.approximateWeightKg).toBe(108); // 20 * 5.4 = 108 kg
    expect(result.conversionSummary).toContain('20 पीस');
  });

  it('converts feet purchases to pieces for 20 ft pipes', () => {
    // 100 feet = 5 pieces of 20ft pipe
    const result = convertPurchaseToStock(100, 'feet', samplePipe);
    expect(result.canonicalQuantity).toBe(5);
    expect(result.canonicalUnit).toBe('piece');
    expect(result.approximateWeightKg).toBe(27); // 5 * 5.4 = 27 kg
  });

  it('converts box hardware purchases to pieces', () => {
    const hinge = {
      unit: 'piece' as const,
      weight_kg_per_unit: 1.2,
      shape: 'accessory',
    };
    // 2 boxes (50 pcs/box) = 100 pieces
    const result = convertPurchaseToStock(2, 'box', hinge);
    expect(result.canonicalQuantity).toBe(100);
    expect(result.canonicalUnit).toBe('piece');
    expect(result.approximateWeightKg).toBe(120);
  });
});

describe('Dharam Kanta (Weighbridge) Reconciliation', () => {
  it('identifies exact weight match as acceptable', () => {
    const rec = reconcileKantaWeight(500, 500);
    expect(rec.varianceKg).toBe(0);
    expect(rec.variancePercent).toBe(0);
    expect(rec.isAcceptable).toBe(true);
    expect(rec.statusMessage).toContain('सत्यापित');
  });

  it('flags minor acceptable variance within 2% tolerance', () => {
    // 500 kg billed, 495 kg actual (-1% variance)
    const rec = reconcileKantaWeight(500, 495, 2.0);
    expect(rec.varianceKg).toBe(-5);
    expect(rec.variancePercent).toBe(-1);
    expect(rec.isAcceptable).toBe(true);
  });

  it('flags unacceptable variance exceeding tolerance', () => {
    // 500 kg billed, 470 kg actual (-6% variance)
    const rec = reconcileKantaWeight(500, 470, 2.0);
    expect(rec.varianceKg).toBe(-30);
    expect(rec.variancePercent).toBe(-6);
    expect(rec.isAcceptable).toBe(false);
    expect(rec.statusMessage).toContain('चेतावनी');
  });
});
