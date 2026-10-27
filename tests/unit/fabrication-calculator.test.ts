import { describe, it, expect } from 'vitest';
import {
  calculateFabricationWeight,
  calculateFabricationPrice,
  ANGLE_OPTIONS,
  SHEET_OPTIONS,
  SUPPORT_OPTIONS,
  STANDARD_GATE_SIZES,
  feetToMm,
  mmToFeet
} from '@/features/catalog/fabrication-calculator';

describe('Fabrication Calculator', () => {
  it('calculates weight breakdown for 6x3 ft gate accurately', () => {
    // 6x3 ft door with standard 18G sheet, 32x3 angle, 10mm bar
    const breakdown = calculateFabricationWeight(
      6.0,
      3.0,
      ANGLE_OPTIONS[0],
      SHEET_OPTIONS[0],
      SUPPORT_OPTIONS[0]
    );

    expect(breakdown.perimeterFeet).toBe(18);
    // angle: 18 ft * 0.85 = 15.3 kg
    expect(breakdown.angleWeightKg).toBe(15.3);
    // sheet area: 18 sq.ft * 0.95 = 17.1 kg
    expect(breakdown.areaSqFt).toBe(18);
    expect(breakdown.sheetWeightKg).toBe(17.1);
    // support: 4.5 * (6/7) = 3.9 kg
    expect(breakdown.supportWeightKg).toBe(3.9);
    // hardware: 2.0 kg
    expect(breakdown.hardwareWeightKg).toBe(2.0);
    // total: 15.3 + 17.1 + 3.9 + 2.0 = 38.3 kg
    expect(breakdown.totalWeightKg).toBe(38.3);
  });

  it('calculates weight breakdown for 8x3.4 ft gate accurately', () => {
    const breakdown = calculateFabricationWeight(
      8.0,
      3.4,
      ANGLE_OPTIONS[0],
      SHEET_OPTIONS[0],
      SUPPORT_OPTIONS[0]
    );

    // perimeter: 2 * (8 + 3.4) = 22.8 ft
    expect(breakdown.perimeterFeet).toBe(22.8);
    // angle: 22.8 * 0.85 = 19.38 -> 19.4 kg
    expect(breakdown.angleWeightKg).toBe(19.4);
    // area: 8 * 3.4 = 27.2 sq.ft
    expect(breakdown.areaSqFt).toBe(27.2);
    // sheet: 27.2 * 0.95 = 25.84 -> 25.8 kg
    expect(breakdown.sheetWeightKg).toBe(25.8);
    // support: 4.5 * (8/7) = 5.1 kg
    expect(breakdown.supportWeightKg).toBe(5.1);
    // hardware: 2.0 kg
    expect(breakdown.hardwareWeightKg).toBe(2.0);
    // total: 19.4 + 25.8 + 5.1 + 2.0 = 52.3 kg
    expect(breakdown.totalWeightKg).toBe(52.3);
  });

  it('calculates Option A (Per Kg) price rounded to neat retail figure', () => {
    const result = calculateFabricationPrice(38.3, 'per_kg', 110);
    // 38.3 * 110 = 4213 -> rounded to nearest 50 = 4200
    expect(result.priceInr).toBe(4200);
    expect(result.priceMinor).toBe(420000);
  });

  it('calculates Option C (Fixed) price directly', () => {
    const result = calculateFabricationPrice(38.3, 'fixed', 110, 4500);
    expect(result.priceInr).toBe(4500);
    expect(result.priceMinor).toBe(450000);
  });

  it('converts between feet and mm properly', () => {
    expect(feetToMm(6)).toBe(1829);
    expect(feetToMm(3)).toBe(914);
    expect(mmToFeet(1829)).toBe(6);
    expect(mmToFeet(914)).toBe(3);
  });

  it('has all 5 requested standard sizes', () => {
    expect(STANDARD_GATE_SIZES).toHaveLength(5);
    expect(STANDARD_GATE_SIZES.map(s => s.id)).toEqual([
      'size-6x3',
      'size-7x3',
      'size-8x3',
      'size-8x3.4',
      'size-8x3.5'
    ]);
  });
});
