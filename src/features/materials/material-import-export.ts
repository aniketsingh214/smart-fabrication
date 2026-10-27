import { MaterialItem, MATERIAL_CATEGORIES, normalizeMaterialSpecs } from './material-catalog-data';

export type CSVImportRow = {
  rowNumber: number;
  code?: string;
  name: string;
  name_hi?: string;
  category: string;
  size?: string;
  gauge?: string;
  thickness_mm?: number;
  unit: string;
  weight_kg_per_unit?: number;
  reorder_level?: number;
  brand?: string;
  grade?: string;
  aliases?: string;
  errors: string[];
  isDuplicate?: boolean;
};

export type ImportSummary = {
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicateRows: number;
  items: CSVImportRow[];
};

export function generateMaterialCSVTemplate(): string {
  const headers = [
    'Material Code',
    'English Name*',
    'Hindi Name',
    'Category ID*',
    'Size',
    'Gauge',
    'Thickness (mm)*',
    'Unit (piece/kg/sheet/m/litre)*',
    'Weight per Unit (kg)*',
    'Reorder Level',
    'Brand',
    'Grade',
    'Local Aliases (comma-separated)',
  ];

  const sampleRows = [
    [
      'PIPE-SQ-25-18G',
      'MS Square Pipe 25x25 mm (1") 18G',
      'एम एस चौकोर पाइप 1 इंच (18 गेज)',
      'ms_pipes',
      '25x25 mm',
      '18G',
      '1.2',
      'piece',
      '5.4',
      '20',
      'APL Apollo',
      'YSt 210',
      '1 इंची पाइप, 25mm box pipe',
    ],
    [
      'ANGLE-32x3',
      'MS Angle 32x32x3 mm (1¼" x 3mm)',
      'एम एस एंगल 1¼ इंच × 3mm',
      'ms_angles',
      '32x32x3 mm',
      '10G',
      '3.0',
      'kg',
      '1.0',
      '100',
      'Sail / Tata',
      'IS 2062',
      'सवा इंची एंगल, दरवाजा एंगल',
    ],
    [
      'SHEET-CR-18G',
      'CR Plain Sheet 18G (1.2 mm) Tata',
      'सी आर सादा चादर 18 गेज',
      'sheets',
      '8x4 ft',
      '18G',
      '1.2',
      'sheet',
      '28.5',
      '10',
      'Tata Steel',
      'CR-1',
      '18 गेज चादर, गेट चादर',
    ],
  ];

  const csvLines = [
    headers.join(','),
    ...sampleRows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ];

  return csvLines.join('\n');
}

export function parseAndValidateMaterialCSV(
  csvContent: string,
  existingMaterials: MaterialItem[] = []
): ImportSummary {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return {
      totalRows: 0,
      validRows: 0,
      errorRows: 0,
      duplicateRows: 0,
      items: [],
    };
  }

  const existingNorms = new Set(
    existingMaterials.map((m) =>
      normalizeMaterialSpecs({
        name: m.name,
        size: m.size,
        thickness_mm: m.thickness_mm,
        gauge: m.gauge,
        category_id: m.category_id,
      })
    )
  );

  const parsedItems: CSVImportRow[] = [];
  const validCategoryIds = new Set(MATERIAL_CATEGORIES.map((c) => c.id));

  // Parse lines starting from index 1 (skipping header)
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Regex to split comma-separated values respecting quotes
    const cells = (rawLine.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [])
      .map((c) => c.replace(/^"|"$/g, '').trim());

    if (cells.length < 2) continue;

    const rowNum = i + 1;
    const errors: string[] = [];

    const code = cells[0] || '';
    const name = cells[1] || '';
    const name_hi = cells[2] || '';
    const category = (cells[3] || '').toLowerCase().trim();
    const size = cells[4] || '';
    const gauge = cells[5] || '';
    const thickness_mm = parseFloat(cells[6]);
    const unit = (cells[7] || '').toLowerCase().trim();
    const weight_kg_per_unit = parseFloat(cells[8]);
    const reorder_level = parseInt(cells[9], 10) || 0;
    const brand = cells[10] || '';
    const grade = cells[11] || '';
    const aliases = cells[12] || '';

    if (!name) errors.push('नाम (English Name) आवश्यक है।');
    if (!category || !validCategoryIds.has(category)) {
      errors.push(`मान्य श्रेणी आवश्यक है। मान्य श्रेणियां: ${Array.from(validCategoryIds).join(', ')}`);
    }
    if (isNaN(thickness_mm) || thickness_mm <= 0) {
      errors.push('मोटाई (Thickness mm) शून्य से अधिक होनी चाहिए।');
    }
    if (!['kg', 'piece', 'sheet', 'm', 'litre'].includes(unit)) {
      errors.push('मान्य यूनिट चुनें (kg, piece, sheet, m, litre)।');
    }
    if (isNaN(weight_kg_per_unit) || weight_kg_per_unit <= 0) {
      errors.push('वजन प्रति यूनिट (Weight per unit) शून्य से अधिक होना चाहिए।');
    }

    const norm = normalizeMaterialSpecs({
      name,
      size,
      thickness_mm: isNaN(thickness_mm) ? 1 : thickness_mm,
      gauge,
      category_id: category,
    });

    const isDuplicate = existingNorms.has(norm);

    parsedItems.push({
      rowNumber: rowNum,
      code,
      name,
      name_hi,
      category,
      size,
      gauge,
      thickness_mm: isNaN(thickness_mm) ? undefined : thickness_mm,
      unit,
      weight_kg_per_unit: isNaN(weight_kg_per_unit) ? undefined : weight_kg_per_unit,
      reorder_level,
      brand,
      grade,
      aliases,
      errors,
      isDuplicate,
    });
  }

  const validRows = parsedItems.filter((item) => item.errors.length === 0).length;
  const errorRows = parsedItems.filter((item) => item.errors.length > 0).length;
  const duplicateRows = parsedItems.filter((item) => item.isDuplicate).length;

  return {
    totalRows: parsedItems.length,
    validRows,
    errorRows,
    duplicateRows,
    items: parsedItems,
  };
}

export function exportMaterialsToCSV(materials: MaterialItem[]): string {
  const headers = [
    'Code',
    'Name',
    'Hindi Name',
    'Category',
    'Size',
    'Gauge',
    'Thickness (mm)',
    'Unit',
    'Weight per Unit (kg)',
    'Reorder Level',
    'Brand',
    'Grade',
    'Aliases',
  ];

  const rows = materials.map((m) => [
    m.code,
    m.name,
    m.name_hi,
    m.category_id,
    m.size,
    m.gauge || '',
    m.thickness_mm.toString(),
    m.unit,
    m.weight_kg_per_unit.toString(),
    m.reorder_level.toString(),
    m.brand || '',
    m.grade || '',
    m.local_aliases.join(', '),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}
