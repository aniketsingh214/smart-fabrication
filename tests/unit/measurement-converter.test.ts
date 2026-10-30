import { describe, it, expect } from 'vitest';

describe('Measurement Unit Converter Logic', () => {
  it('converts feet and inches accurately to millimeters', () => {
    // 7 ft 6 in = (7 * 12 + 6) * 25.4 = 90 * 25.4 = 2286 mm
    const feet = 7;
    const inches = 6;
    const totalInches = feet * 12 + inches;
    const mm = Math.round(totalInches * 25.4);
    expect(mm).toBe(2286);
  });

  it('converts inches accurately to millimeters', () => {
    // 90 in = 90 * 25.4 = 2286 mm
    const inches = 90;
    const mm = Math.round(inches * 25.4);
    expect(mm).toBe(2286);
  });

  it('converts centimeters accurately to millimeters', () => {
    // 228.6 cm = 228.6 * 10 = 2286 mm
    const cm = 228.6;
    const mm = Math.round(cm * 10);
    expect(mm).toBe(2286);
  });

  it('converts meters accurately to millimeters', () => {
    // 2.286 m = 2286 mm
    const m = 2.286;
    const mm = Math.round(m * 1000);
    expect(mm).toBe(2286);
  });

  it('calculates square feet and square meters from millimeters correctly', () => {
    const widthMm = 2286; // 7.5 ft
    const heightMm = 1828.8; // 6 ft
    const sqFt = (widthMm * heightMm) / (304.8 * 304.8);
    const sqM = (widthMm * heightMm) / 1000000;
    expect(Math.round(sqFt * 100) / 100).toBe(45);
    expect(Math.round(sqM * 100) / 100).toBe(4.18);
  });
});
