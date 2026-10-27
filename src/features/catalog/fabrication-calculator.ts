/**
 * GateWala Fabrication Calculator & Sizing Standards
 * Supports Option A (Per Kg Rate) and Option C (Fixed Piece Rate)
 * Calculates Angle, Sheet (Chadar), Support Bar (Sariya/Patti), and Hardware breakdown.
 */

export interface AngleSpec {
  id: string;
  label: string;
  weightKgPerFoot: number;
}

export interface SheetSpec {
  id: string;
  gauge: string;
  label: string;
  weightKgPerSqFt: number;
}

export interface SupportSpec {
  id: string;
  label: string;
  baseWeightKg: number; // For a standard 7-foot door
}

export const ANGLE_OPTIONS: AngleSpec[] = [
  { id: 'angle-32-3', label: '1¼" × 3mm एंगल (32×3 mm) - लाइट व स्टैंडर्ड', weightKgPerFoot: 0.85 },
  { id: 'angle-40-3', label: '1½" × 3mm एंगल (40×3 mm) - मीडियम गेट', weightKgPerFoot: 1.05 },
  { id: 'angle-40-5', label: '1½" × 5mm एंगल (40×5 mm) - हैवी ड्यूटी', weightKgPerFoot: 1.65 },
  { id: 'angle-50-5', label: '2" × 5mm एंगल (50×5 mm) - एक्स्ट्रा हैवी गेट', weightKgPerFoot: 2.25 },
];

export const SHEET_OPTIONS: SheetSpec[] = [
  { id: 'sheet-18g', gauge: '18 Gauge', label: '18 गेज चादर (~1.2 mm) - सबसे ज्यादा चलने वाली', weightKgPerSqFt: 0.95 },
  { id: 'sheet-16g', gauge: '16 Gauge', label: '16 गेज चादर (~1.6 mm) - मजबूत व सुरक्षित', weightKgPerSqFt: 1.25 },
  { id: 'sheet-14g', gauge: '14 Gauge', label: '14 गेज चादर (~2.0 mm) - एक्स्ट्रा हैवी', weightKgPerSqFt: 1.60 },
  { id: 'sheet-20g', gauge: '20 Gauge', label: '20 गेज चादर (~0.9 mm) - हल्की चादर', weightKgPerSqFt: 0.75 },
];

export const SUPPORT_OPTIONS: SupportSpec[] = [
  { id: 'bar-10mm', label: '10 mm चौकोर सरिया (मजबूत सपोर्ट)', baseWeightKg: 4.5 },
  { id: 'bar-12mm', label: '12 mm चौकोर सरिया (हैवी सपोर्ट)', baseWeightKg: 6.0 },
  { id: 'patti-25-3', label: '1" × 3 सूत पत्ती (फ्लैट सपोर्ट)', baseWeightKg: 3.5 },
  { id: 'light-support', label: 'साधारण सपोर्ट (लाइट)', baseWeightKg: 2.0 },
];

export const HARDWARE_WEIGHT_KG = 2.0; // कब्जा, कुंडी, सिटकनी, लैच

export interface FabricationSizePreset {
  id: string;
  heightFeet: number;
  widthFeet: number;
  label: string;
  widthMm: number;
  heightMm: number;
}

export const STANDARD_GATE_SIZES: FabricationSizePreset[] = [
  { id: 'size-6x3', heightFeet: 6.0, widthFeet: 3.0, label: '6 × 3 फीट (सादा दरवाजा)', widthMm: 914, heightMm: 1829 },
  { id: 'size-7x3', heightFeet: 7.0, widthFeet: 3.0, label: '7 × 3 फीट (स्टैंडर्ड दरवाजा)', widthMm: 914, heightMm: 2134 },
  { id: 'size-8x3', heightFeet: 8.0, widthFeet: 3.0, label: '8 × 3 फीट (ऊँचा दरवाजा)', widthMm: 914, heightMm: 2438 },
  { id: 'size-8x3.4', heightFeet: 8.0, widthFeet: 3.4, label: '8 × 3.4 फीट (~41 इंच चौड़ा)', widthMm: 1036, heightMm: 2438 },
  { id: 'size-8x3.5', heightFeet: 8.0, widthFeet: 3.5, label: '8 × 3.5 फीट (42 इंच चौड़ा)', widthMm: 1067, heightMm: 2438 },
];

export interface WeightBreakdown {
  perimeterFeet: number;
  angleWeightKg: number;
  areaSqFt: number;
  sheetWeightKg: number;
  supportWeightKg: number;
  hardwareWeightKg: number;
  totalWeightKg: number;
}

/**
 * Calculates fabrication weight breakdown based on dimensions and material specifications
 */
export function calculateFabricationWeight(
  heightFeet: number,
  widthFeet: number,
  angleSpec: AngleSpec = ANGLE_OPTIONS[0],
  sheetSpec: SheetSpec = SHEET_OPTIONS[0],
  supportSpec: SupportSpec = SUPPORT_OPTIONS[0],
  hardwareWeightKg = HARDWARE_WEIGHT_KG
): WeightBreakdown {
  const perimeterFeet = 2 * (heightFeet + widthFeet);
  const angleWeightKg = Math.round(perimeterFeet * angleSpec.weightKgPerFoot * 10) / 10;

  const areaSqFt = Math.round(heightFeet * widthFeet * 100) / 100;
  const sheetWeightKg = Math.round(areaSqFt * sheetSpec.weightKgPerSqFt * 10) / 10;

  const supportWeightKg = Math.round(supportSpec.baseWeightKg * (heightFeet / 7.0) * 10) / 10;

  const totalWeightKg = Math.round(
    (angleWeightKg + sheetWeightKg + supportWeightKg + hardwareWeightKg) * 10
  ) / 10;

  return {
    perimeterFeet,
    angleWeightKg,
    areaSqFt,
    sheetWeightKg,
    supportWeightKg,
    hardwareWeightKg,
    totalWeightKg,
  };
}

/**
 * Calculates estimated price in Indian Rupees (INR) based on Pricing Model:
 * Option A: Per Kg Rate (totalWeightKg * ratePerKg)
 * Option C: Fixed Price (direct piece price or default calculated)
 */
export function calculateFabricationPrice(
  totalWeightKg: number,
  pricingModel: 'per_kg' | 'fixed',
  ratePerKg = 110,
  fixedPrice = 0
): { priceInr: number; priceMinor: number } {
  let priceInr = 0;
  if (pricingModel === 'per_kg') {
    // Round to nearest 50 rupees for clean retail quotation
    const raw = totalWeightKg * ratePerKg;
    priceInr = Math.round(raw / 50) * 50;
  } else {
    priceInr = Math.round(fixedPrice);
  }
  return {
    priceInr,
    priceMinor: Math.round(priceInr * 100),
  };
}

/**
 * Helper to convert Feet to Millimetres
 */
export function feetToMm(feet: number): number {
  return Math.round(feet * 304.8);
}

/**
 * Helper to convert Millimetres to Feet (1 decimal)
 */
export function mmToFeet(mm: number): number {
  return Math.round((mm / 304.8) * 10) / 10;
}
