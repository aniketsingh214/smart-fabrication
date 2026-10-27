import { MaterialItem } from './material-catalog-data';

export type PurchaseUnit = 'kg' | 'piece' | 'bundle' | 'feet' | 'meter' | 'box' | 'sheet' | 'litre';

export type UnitConversionResult = {
  canonicalQuantity: number;
  canonicalUnit: string;
  approximateWeightKg: number;
  conversionSummary: string;
};

export type KantaReconciliation = {
  billedWeightKg: number;
  actualWeightKg: number;
  varianceKg: number;
  variancePercent: number;
  isAcceptable: boolean; // within tolerance (e.g. +/- 2%)
  statusMessage: string;
};

/**
 * Converts commercial purchase quantities (e.g. 10 bundles or 200 feet)
 * into canonical inventory units (e.g. pieces or kg) based on material specifications.
 */
export function convertPurchaseToStock(
  quantity: number,
  purchaseUnit: PurchaseUnit,
  material: Pick<MaterialItem, 'unit' | 'weight_kg_per_unit' | 'standard_length_m' | 'shape'>,
  customBundleSize = 4 // standard pipe bundle in India is usually 4 to 6 pipes
): UnitConversionResult {
  if (quantity <= 0) {
    return {
      canonicalQuantity: 0,
      canonicalUnit: material.unit,
      approximateWeightKg: 0,
      conversionSummary: 'शून्य मात्रा',
    };
  }

  const standardLengthFt = (material.standard_length_m ?? 6.0) * 3.28084; // ~19.68 ft (20ft nominal)

  // Case 1: Purchase unit is identical to storage unit
  if (purchaseUnit === material.unit) {
    const weight =
      material.unit === 'kg'
        ? quantity
        : quantity * (material.weight_kg_per_unit || 1.0);
    return {
      canonicalQuantity: quantity,
      canonicalUnit: material.unit,
      approximateWeightKg: Number(weight.toFixed(2)),
      conversionSummary: `${quantity} ${material.unit}`,
    };
  }

  // Case 2: Purchase in Bundles (बंडल) -> Convert to Pieces
  if (purchaseUnit === 'bundle') {
    const pieces = quantity * customBundleSize;
    const weight = pieces * (material.weight_kg_per_unit || 1.0);
    return {
      canonicalQuantity: material.unit === 'kg' ? Number(weight.toFixed(2)) : pieces,
      canonicalUnit: material.unit,
      approximateWeightKg: Number(weight.toFixed(2)),
      conversionSummary: `${quantity} बंडल = ${pieces} पीस (~${weight.toFixed(1)} kg)`,
    };
  }

  // Case 3: Purchase in Feet (फीट) -> Convert to Pieces or KG
  if (purchaseUnit === 'feet') {
    const pieces = Number((quantity / 20.0).toFixed(2)); // Standard 20 ft length
    const weight = pieces * (material.weight_kg_per_unit || 1.0);
    return {
      canonicalQuantity: material.unit === 'piece' ? pieces : material.unit === 'kg' ? Number(weight.toFixed(2)) : quantity,
      canonicalUnit: material.unit,
      approximateWeightKg: Number(weight.toFixed(2)),
      conversionSummary: `${quantity} फीट = ~${pieces} पीस (20 ft प्रति पीस)`,
    };
  }

  // Case 4: Purchase in Boxes (डिब्बा / बॉक्स) -> Convert to Pieces
  if (purchaseUnit === 'box') {
    const piecesPerBox = 50; // standard hardware box packing
    const pieces = quantity * piecesPerBox;
    const weight = pieces * (material.weight_kg_per_unit || 0.1);
    return {
      canonicalQuantity: pieces,
      canonicalUnit: 'piece',
      approximateWeightKg: Number(weight.toFixed(2)),
      conversionSummary: `${quantity} बॉक्स = ${pieces} पीस (${piecesPerBox} पीस/बॉक्स)`,
    };
  }

  // Default fallback
  const fallbackWeight = quantity * (material.weight_kg_per_unit || 1.0);
  return {
    canonicalQuantity: quantity,
    canonicalUnit: material.unit,
    approximateWeightKg: Number(fallbackWeight.toFixed(2)),
    conversionSummary: `${quantity} ${purchaseUnit}`,
  };
}

/**
 * Reconciles Billed Weight (बिल का वजन) vs Actual Received Weight (कांटा पर्ची वजन)
 * Common in steel trading where weighbridge slips determine physical stock accuracy.
 */
export function reconcileKantaWeight(
  billedWeightKg: number,
  actualWeightKg: number,
  tolerancePercent = 2.0 // default 2% steel trading tolerance
): KantaReconciliation {
  if (billedWeightKg <= 0 || actualWeightKg <= 0) {
    return {
      billedWeightKg,
      actualWeightKg,
      varianceKg: 0,
      variancePercent: 0,
      isAcceptable: true,
      statusMessage: 'वजन दर्ज करें',
    };
  }

  const varianceKg = Number((actualWeightKg - billedWeightKg).toFixed(2));
  const variancePercent = Number(((varianceKg / billedWeightKg) * 100).toFixed(2));
  const isAcceptable = Math.abs(variancePercent) <= tolerancePercent;

  let statusMessage = 'वजन बिल्कुल सही है (सत्यापित)';
  if (varianceKg > 0) {
    statusMessage = `+${varianceKg} kg अतिरिक्त माल आया (+${variancePercent}%)`;
  } else if (varianceKg < 0) {
    statusMessage = `${varianceKg} kg माल कम आया (${variancePercent}%)`;
  }

  if (!isAcceptable) {
    statusMessage += ` — चेतावनी: अनुमेय सीमा (${tolerancePercent}%) से अधिक अंतर!`;
  }

  return {
    billedWeightKg,
    actualWeightKg,
    varianceKg,
    variancePercent,
    isAcceptable,
    statusMessage,
  };
}
