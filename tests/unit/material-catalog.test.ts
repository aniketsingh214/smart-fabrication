import { describe, it, expect } from 'vitest';
import {
  MATERIAL_CATEGORIES,
  PRELOADED_MATERIAL_CATALOG,
  normalizeMaterialSpecs,
  matchMaterialSearch,
} from '@/features/materials/material-catalog-data';

describe('Material Master Predefined Catalog', () => {
  it('has all 14 mandatory fabrication categories with Hindi names', () => {
    expect(MATERIAL_CATEGORIES.length).toBe(14);
    const categoryIds = MATERIAL_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toContain('ms_pipes');
    expect(categoryIds).toContain('ms_angles');
    expect(categoryIds).toContain('ms_flats');
    expect(categoryIds).toContain('ms_bars');
    expect(categoryIds).toContain('ms_channels');
    expect(categoryIds).toContain('sheets');
    expect(categoryIds).toContain('stainless_steel');
    expect(categoryIds).toContain('aluminium');
    expect(categoryIds).toContain('hardware');
    expect(categoryIds).toContain('welding');
    expect(categoryIds).toContain('tools');
    expect(categoryIds).toContain('paints');
    expect(categoryIds).toContain('roofing');
    expect(categoryIds).toContain('fasteners');

    // Every category must have a Hindi name
    MATERIAL_CATEGORIES.forEach((c) => {
      expect(c.name_hi).toBeTruthy();
      expect(c.name).toBeTruthy();
    });
  });

  it('has extensive predefined materials with valid specifications', () => {
    expect(PRELOADED_MATERIAL_CATALOG.length).toBeGreaterThan(30);

    PRELOADED_MATERIAL_CATALOG.forEach((item) => {
      expect(item.code).toBeTruthy();
      expect(item.name).toBeTruthy();
      expect(item.name_hi).toBeTruthy();
      expect(item.category_id).toBeTruthy();
      expect(item.thickness_mm).toBeGreaterThan(0);
      expect(item.weight_kg_per_unit).toBeGreaterThan(0);
      expect(item.reorder_level).toBeGreaterThanOrEqual(0);
      expect(item.unit).toBeTruthy();
      expect(item.purchase_units.length).toBeGreaterThan(0);
    });
  });

  it('correctly normalizes specifications for duplicate detection', () => {
    const key1 = normalizeMaterialSpecs({
      name: 'MS Square Pipe 25x25 18G',
      size: '25x25 mm',
      thickness_mm: 1.2,
      gauge: '18G',
      category_id: 'ms_pipes',
    });

    const key2 = normalizeMaterialSpecs({
      name: '25x25mm Square Pipe (18 Gauge)',
      size: '25x25 mm',
      thickness_mm: 1.2,
      gauge: '18g',
      category_id: 'ms_pipes',
    });

    expect(key1).toBe(key2);
  });

  it('searches materials by English name, Hindi name, and local aliases', () => {
    const pipe18g = PRELOADED_MATERIAL_CATALOG.find((m) => m.code === 'PIPE-SQ-25-18G')!;

    // 1. English search
    expect(matchMaterialSearch(pipe18g, 'Square Pipe')).toBe(true);
    expect(matchMaterialSearch(pipe18g, '25x25')).toBe(true);

    // 2. Hindi search
    expect(matchMaterialSearch(pipe18g, 'चौकोर पाइप')).toBe(true);

    // 3. Local alias search
    expect(matchMaterialSearch(pipe18g, '1 इंची पाइप')).toBe(true);
    expect(matchMaterialSearch(pipe18g, 'box pipe')).toBe(true);

    // 4. Non-matching search
    expect(matchMaterialSearch(pipe18g, 'aluminium sliding')).toBe(false);
  });
});
