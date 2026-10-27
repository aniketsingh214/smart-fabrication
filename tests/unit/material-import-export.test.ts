import { describe, it, expect } from 'vitest';
import {
  generateMaterialCSVTemplate,
  parseAndValidateMaterialCSV,
  exportMaterialsToCSV,
} from '@/features/materials/material-import-export';
import { PRELOADED_MATERIAL_CATALOG } from '@/features/materials/material-catalog-data';

describe('Bulk CSV Import/Export Engine', () => {
  it('generates a valid CSV template with correct headers and sample rows', () => {
    const template = generateMaterialCSVTemplate();
    expect(template).toContain('Material Code');
    expect(template).toContain('English Name*');
    expect(template).toContain('PIPE-SQ-25-18G');
    expect(template).toContain('ms_pipes');
  });

  it('parses valid CSV rows with zero errors', () => {
    const validCSV = `Material Code,English Name*,Hindi Name,Category ID*,Size,Gauge,Thickness (mm)*,Unit (piece/kg/sheet/m/litre)*,Weight per Unit (kg)*,Reorder Level,Brand,Grade,Local Aliases
"PIPE-SQ-25","MS Pipe 25x25 18G","चौकोर पाइप","ms_pipes","25x25 mm","18G","1.2","piece","5.4","20","Tata","IS 2062","1 inch pipe"`;

    const summary = parseAndValidateMaterialCSV(validCSV);
    expect(summary.totalRows).toBe(1);
    expect(summary.validRows).toBe(1);
    expect(summary.errorRows).toBe(0);
    expect(summary.items[0].errors.length).toBe(0);
    expect(summary.items[0].name).toBe('MS Pipe 25x25 18G');
  });

  it('detects invalid fields and reports specific error messages', () => {
    const invalidCSV = `Material Code,English Name*,Hindi Name,Category ID*,Size,Gauge,Thickness (mm)*,Unit (piece/kg/sheet/m/litre)*,Weight per Unit (kg)*,Reorder Level,Brand,Grade,Local Aliases
"PIPE-BAD","","खराब पाइप","invalid_category","25x25","18G","-1.2","invalid_unit","-5","0","","",""`;

    const summary = parseAndValidateMaterialCSV(invalidCSV);
    expect(summary.totalRows).toBe(1);
    expect(summary.errorRows).toBe(1);
    const errors = summary.items[0].errors;
    expect(errors.some((e) => e.includes('English Name'))).toBe(true);
    expect(errors.some((e) => e.includes('मान्य श्रेणी'))).toBe(true);
    expect(errors.some((e) => e.includes('मोटाई'))).toBe(true);
    expect(errors.some((e) => e.includes('मान्य यूनिट'))).toBe(true);
  });

  it('exports materials to CSV correctly', () => {
    const csv = exportMaterialsToCSV(PRELOADED_MATERIAL_CATALOG.slice(0, 3));
    expect(csv).toContain('Code,Name,Hindi Name');
    expect(csv).toContain('PIPE-SQ-19-18G');
    expect(csv).toContain('PIPE-SQ-25-18G');
  });
});
