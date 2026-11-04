/**
 * Real visual feature extraction and similarity ranking engine.
 * Computes multi-dimensional image embeddings (spatial color histograms,
 * directional Sobel gradients, structural fill factor) and cosine similarity.
 */

export interface VisualFeatureVector {
  vector: number[];
  dominantColor: string;
  hasOpenGrillPattern: boolean;
  edgeDensity: number;
}

export interface CatalogSearchItem {
  id: string;
  name: string;
  nameHi: string;
  slug: string;
  category: string;
  categorySlug: string;
  categoryHi: string;
  material: string;
  priceFormatted: string;
  priceMinor?: number;
  publicId: string;
  visualEmbedding: number[];
  tags: string[];
}

/**
 * Extracts normalized 120-dimensional visual feature embedding vector from an image element.
 */
export function extractImageFeatures(img: HTMLImageElement | HTMLCanvasElement): VisualFeatureVector {
  const canvas = document.createElement('canvas');
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      vector: new Array(120).fill(0),
      dominantColor: '#334155',
      hasOpenGrillPattern: false,
      edgeDensity: 0.5
    };
  }

  ctx.drawImage(img, 0, 0, size, size);
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  // 1. Spatial Color Histogram (4x4 quadrants * 3 color channels = 48 values)
  const colorFeatures: number[] = new Array(48).fill(0);
  let totalR = 0, totalG = 0, totalB = 0;
  const quadrantSize = size / 4;

  for (let y = 0; y < size; y++) {
    const qY = Math.min(3, Math.floor(y / quadrantSize));
    for (let x = 0; x < size; x++) {
      const qX = Math.min(3, Math.floor(x / quadrantSize));
      const qIdx = qY * 4 + qX;
      const idx = (y * size + x) * 4;

      const r = data[idx] / 255;
      const g = data[idx + 1] / 255;
      const b = data[idx + 2] / 255;

      totalR += r;
      totalG += g;
      totalB += b;

      colorFeatures[qIdx * 3] += r;
      colorFeatures[qIdx * 3 + 1] += g;
      colorFeatures[qIdx * 3 + 2] += b;
    }
  }

  // Normalize color features
  const pixelsPerQuadrant = quadrantSize * quadrantSize;
  for (let i = 0; i < colorFeatures.length; i++) {
    colorFeatures[i] /= pixelsPerQuadrant;
  }

  // 2. Grayscale conversion for Sobel Directional Edge Histogram
  const gray = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  // 3. Directional Sobel Gradients (16 quadrants * 4 gradient directions: H, V, D1, D2 = 64 values)
  const edgeFeatures: number[] = new Array(64).fill(0);
  let totalEdgeEnergy = 0;
  let darkPixelCount = 0;

  for (let y = 1; y < size - 1; y++) {
    const qY = Math.min(3, Math.floor(y / quadrantSize));
    for (let x = 1; x < size - 1; x++) {
      const qX = Math.min(3, Math.floor(x / quadrantSize));
      const qIdx = qY * 4 + qX;
      const idx = y * size + x;

      // Sobel Kernels
      const gx =
        -gray[idx - size - 1] + gray[idx - size + 1] -
        2 * gray[idx - 1] + 2 * gray[idx + 1] -
        gray[idx + size - 1] + gray[idx + size + 1];

      const gy =
        -gray[idx - size - 1] - 2 * gray[idx - size] - gray[idx - size + 1] +
        gray[idx + size - 1] + 2 * gray[idx + size] + gray[idx + size + 1];

      const mag = Math.sqrt(gx * gx + gy * gy) / 1020;
      totalEdgeEnergy += mag;

      if (gray[idx] < 60) {
        darkPixelCount++;
      }

      // Quantize angle into 4 bins
      const angle = Math.atan2(gy, gx);
      const normalizedAngle = (angle + Math.PI) / (Math.PI / 4);
      const dirBin = Math.floor(normalizedAngle) % 4;

      edgeFeatures[qIdx * 4 + dirBin] += mag;
    }
  }

  for (let i = 0; i < edgeFeatures.length; i++) {
    edgeFeatures[i] /= pixelsPerQuadrant;
  }

  // 4. Structural Fill Factor & Contrast (8 values)
  const totalPixels = size * size;
  const avgR = totalR / totalPixels;
  const avgG = totalG / totalPixels;
  const avgB = totalB / totalPixels;
  const darkRatio = darkPixelCount / totalPixels;
  const avgEdge = totalEdgeEnergy / totalPixels;

  const structuralFeatures = [
    darkRatio,
    avgEdge,
    Math.abs(avgR - avgG),
    Math.abs(avgG - avgB),
    Math.abs(avgR - avgB),
    avgR > 0.6 ? 1 : 0, // High reflectivity / silver mirror stainless steel indicator
    avgEdge > 0.15 ? 1 : 0, // High complexity / laser cut / mesh indicator
    darkRatio > 0.4 ? 1 : 0 // Solid black metal indicator
  ];

  // Concatenate all 120 features
  const rawVector = [...colorFeatures, ...edgeFeatures, ...structuralFeatures];

  // L2 Normalization
  let sumSq = 0;
  for (const v of rawVector) {
    sumSq += v * v;
  }
  const norm = Math.sqrt(sumSq) || 1;
  const normalizedVector = rawVector.map((v) => v / norm);

  const dominantHex = `#${Math.round(avgR * 255).toString(16).padStart(2, '0')}${Math.round(avgG * 255).toString(16).padStart(2, '0')}${Math.round(avgB * 255).toString(16).padStart(2, '0')}`;

  return {
    vector: normalizedVector,
    dominantColor: dominantHex,
    hasOpenGrillPattern: darkRatio < 0.6 && avgEdge > 0.1,
    edgeDensity: avgEdge
  };
}

/**
 * Computes cosine similarity between two normalized vectors (returns 0 to 1).
 */
export function cosineSimilarity(v1: number[], v2: number[]): number {
  if (!v1.length || !v2.length || v1.length !== v2.length) return 0;
  let dot = 0;
  for (let i = 0; i < v1.length; i++) {
    dot += v1[i] * v2[i];
  }
  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, (dot + 1) / 2));
}

/**
 * Text search relevance scoring.
 */
export function computeTextRelevance(query: string, item: CatalogSearchItem): number {
  if (!query.trim()) return 1.0;
  const qTerms = query.toLowerCase().trim().split(/\s+/);
  const targetText = `${item.name} ${item.nameHi} ${item.category} ${item.categoryHi} ${item.material} ${item.tags.join(' ')}`.toLowerCase();

  let matches = 0;
  for (const term of qTerms) {
    if (targetText.includes(term)) {
      matches++;
    }
  }

  return matches / qTerms.length;
}

/**
 * Creates seed embedding vector for catalog products based on their known visual characteristics.
 */
export function createProductVisualEmbedding(options: {
  darkness: number;
  edgeDensity: number;
  silverMetallic?: boolean;
  goldenFinish?: boolean;
  woodGrain?: boolean;
  laserCutMesh?: boolean;
  verticalBars?: boolean;
}): number[] {
  const vector = new Array(120).fill(0);

  // Set color quadrant tendencies
  for (let i = 0; i < 48; i += 3) {
    if (options.silverMetallic) {
      vector[i] = 0.65; // R
      vector[i + 1] = 0.68; // G
      vector[i + 2] = 0.72; // B
    } else if (options.goldenFinish) {
      vector[i] = 0.78;
      vector[i + 1] = 0.65;
      vector[i + 2] = 0.35;
    } else if (options.woodGrain) {
      vector[i] = 0.45;
      vector[i + 1] = 0.28;
      vector[i + 2] = 0.15;
    } else {
      // Matte charcoal / black steel
      const base = 0.15 * (1 - options.darkness);
      vector[i] = base;
      vector[i + 1] = base;
      vector[i + 2] = base + 0.05;
    }
  }

  // Edge direction tendencies
  for (let i = 48; i < 112; i += 4) {
    if (options.verticalBars) {
      vector[i + 1] = 0.85; // Vertical edges
    } else if (options.laserCutMesh) {
      vector[i] = 0.7; // Horizontal
      vector[i + 1] = 0.7; // Vertical
      vector[i + 2] = 0.6; // Diagonal
      vector[i + 3] = 0.6;
    } else {
      vector[i] = options.edgeDensity;
      vector[i + 1] = options.edgeDensity;
    }
  }

  // Structural features
  vector[112] = options.darkness;
  vector[113] = options.edgeDensity;
  vector[117] = options.silverMetallic ? 1 : 0;
  vector[118] = options.laserCutMesh ? 1 : 0;
  vector[119] = options.darkness > 0.5 ? 1 : 0;

  // Normalize
  let sumSq = 0;
  for (const v of vector) sumSq += v * v;
  const norm = Math.sqrt(sumSq) || 1;
  return vector.map((v) => v / norm);
}

/**
 * Standard authentic catalog items used for instant Zepto-style discovery & AI visual search.
 */
export const DEFAULT_CATALOG_ITEMS: CatalogSearchItem[] = [
  {
    id: 'gate-01',
    name: 'Modern Laser Cut Double Swing Gate',
    nameHi: 'आधुनिक लेज़र कट डबल स्विंग मेन गेट',
    slug: 'modern-laser-cut-double-swing-gate',
    category: 'Main Steel Gates',
    categoryHi: 'मुख्य गेट',
    categorySlug: 'main-gates',
    material: 'Heavy Mild Steel & 3mm CNC Laser Sheet',
    priceFormatted: '₹35,000',
    priceMinor: 3500000,
    publicId: 'smart-fabrication/development/steel-gate-album/royal-ss-304-mirror-walnut-gate',
    tags: ['laser cut', 'cnc', 'double door', 'main gate', 'matte black', 'luxury', 'charcoal'],
    visualEmbedding: createProductVisualEmbedding({
      darkness: 0.85,
      edgeDensity: 0.75,
      laserCutMesh: true
    })
  },
  {
    id: 'gate-02',
    name: 'Luxury Champagne Gold Laser Cut SS Gate',
    nameHi: 'लक्ज़री शैम्पेन गोल्ड सीएनसी लेज़र गेट',
    slug: 'luxury-champagne-gold-laser-cut-ss-gate',
    category: 'Laser Cut Gates',
    categoryHi: 'लेज़र कटिंग गेट',
    categorySlug: 'laser-cutting-gates',
    material: 'Stainless Steel 304 & PVD Champagne Gold Finish',
    priceFormatted: '₹68,000',
    priceMinor: 6800000,
    publicId: 'smart-fabrication/development/steel-gate-album/luxury-champagne-gold-laser-cut-ss-gate',
    tags: ['laser', 'gold', 'pvd', 'stainless steel', 'ss 304', 'cnc', 'geometric', 'modern'],
    visualEmbedding: createProductVisualEmbedding({
      darkness: 0.3,
      edgeDensity: 0.85,
      goldenFinish: true,
      laserCutMesh: true
    })
  },
  {
    id: 'gate-03',
    name: 'Minimalist Horizontal Louver Sliding Gate',
    nameHi: 'मिनिमलिस्ट हॉरिजॉन्टल स्लाइडिंग गेट',
    slug: 'minimalist-horizontal-steel-sliding-gate',
    category: 'Sliding Gates',
    categoryHi: 'स्लाइडिंग गेट',
    categorySlug: 'main-gates',
    material: 'Heavy MS Box Pipes & Powder Coated Louver Slats',
    priceFormatted: '₹48,000',
    priceMinor: 4800000,
    publicId: 'smart-fabrication/development/demo-stock/sliding-driveway-gate',
    tags: ['sliding', 'horizontal', 'louver', 'driveway', 'modern', 'clean', 'sliding gate'],
    visualEmbedding: createProductVisualEmbedding({
      darkness: 0.7,
      edgeDensity: 0.65,
      verticalBars: false
    })
  },
  {
    id: 'railing-01',
    name: 'SS 304 Toughened Glass Balcony Railing',
    nameHi: 'एसएस 304 टफन्ड ग्लास बालकनी रेलिंग',
    slug: 'ss-304-glass-balcony-railing',
    category: 'Balcony Railings',
    categoryHi: 'बालकनी व सीढ़ी रेलिंग',
    categorySlug: 'railings',
    material: 'Stainless Steel 304 Posts & 12mm Toughened Glass',
    priceFormatted: '₹1,500 / sq.ft',
    priceMinor: 150000,
    publicId: 'smart-fabrication/development/demo-stock/ss-glass-railing',
    tags: ['railing', 'glass', 'stainless steel', 'ss 304', 'balcony', 'staircase', 'modern'],
    visualEmbedding: createProductVisualEmbedding({
      darkness: 0.2,
      edgeDensity: 0.45,
      silverMetallic: true
    })
  },
  {
    id: 'railing-02',
    name: 'Architectural Stainless Steel Pipe Balustrade',
    nameHi: 'आर्किटेक्चरल स्टेनलेस स्टील पाइप रेलिंग',
    slug: 'architectural-ss-pipe-balustrade',
    category: 'Stainless Steel Railings',
    categoryHi: 'स्टेनलेस स्टील रेलिंग',
    categorySlug: 'railings',
    material: 'Prime SS 304 Grade Round Tubes with Argon Welds',
    priceFormatted: '₹850 / sq.ft',
    priceMinor: 85000,
    publicId: 'smart-fabrication/development/demo-stock/pexels-13272374',
    tags: ['stainless steel', 'ss', 'pipe', 'railing', 'balcony', 'mirror finish', 'argon'],
    visualEmbedding: createProductVisualEmbedding({
      darkness: 0.35,
      edgeDensity: 0.8,
      silverMetallic: true,
      verticalBars: true
    })
  },
  {
    id: 'grill-01',
    name: 'Modern Geometrical Window Safety Grill',
    nameHi: 'मॉडर्न ज्योमेट्रिकल विंडो सेफ्टी ग्रिल',
    slug: 'modern-geometrical-window-safety-grill',
    category: 'Window Grills',
    categoryHi: 'खिड़की जाली',
    categorySlug: 'window-grills',
    material: 'Solid MS Square Bar (12mm) & Perimeter Angle Frame',
    priceFormatted: '₹220 / sq.ft',
    priceMinor: 22000,
    publicId: 'smart-fabrication/development/demo-stock/window-safety-grill',
    tags: ['window', 'grill', 'safety', 'burglar proof', 'square bar', 'anti rust', 'iron'],
    visualEmbedding: createProductVisualEmbedding({
      darkness: 0.75,
      edgeDensity: 0.9,
      laserCutMesh: true
    })
  },
  {
    id: 'shutter-01',
    name: 'Motorized Galvanized Steel Storefront Shutter',
    nameHi: 'मोटराइज्ड कमर्शियल रोलिंग शटर',
    slug: 'motorized-galvanized-steel-rolling-shutter',
    category: 'Commercial Rolling Shutters',
    categoryHi: 'रोलिंग शटर',
    categorySlug: 'rolling-shutters',
    material: '18 Gauge Interlocking Galvanized Iron Laths',
    priceFormatted: '₹42,000',
    priceMinor: 4200000,
    publicId: 'smart-fabrication/development/user-shutters/pin-1140466305672357403',
    tags: ['shutter', 'rolling shutter', 'motorized', 'commercial', 'storefront', 'remote'],
    visualEmbedding: createProductVisualEmbedding({
      darkness: 0.5,
      edgeDensity: 0.85,
      silverMetallic: true
    })
  },
  {
    id: 'door-01',
    name: 'Contemporary Steel Front Security Door',
    nameHi: 'कंटेम्परेरी सॉलिड स्टील फ्रंट सिक्योरिटी डोर',
    slug: 'contemporary-steel-front-security-door',
    category: 'Metal Doors',
    categoryHi: 'मेटल दरवाजे',
    categorySlug: 'metal-doors',
    material: 'Heavy Gauge Mild Steel Sheet & Double Multi-Lock System',
    priceFormatted: '₹28,000',
    priceMinor: 2800000,
    publicId: 'smart-fabrication/development/demo-stock/steel-security-door',
    tags: ['door', 'security door', 'steel door', 'entrance', 'lock', 'front door', 'metal door'],
    visualEmbedding: createProductVisualEmbedding({
      darkness: 0.8,
      edgeDensity: 0.5,
      verticalBars: false
    })
  },
  {
    id: 'custom-01',
    name: 'Handcrafted Wrought Iron Entrance Gate',
    nameHi: 'हस्तनिर्मित रॉट आयरन रॉयल गेट',
    slug: 'handcrafted-wrought-iron-decorative-gate',
    category: 'Decorative Metal Designs',
    categoryHi: 'कस्टम कलात्मक डिज़ाइन',
    categorySlug: 'custom-metal',
    material: 'Hand-Forged Solid Wrought Iron with Cast Spearheads',
    priceFormatted: '₹55,000',
    priceMinor: 5500000,
    publicId: 'smart-fabrication/development/demo-stock/pexels-13278911',
    tags: ['decorative', 'wrought iron', 'handcrafted', 'traditional', 'royal', 'spearhead', 'art'],
    visualEmbedding: createProductVisualEmbedding({
      darkness: 0.9,
      edgeDensity: 0.75,
      verticalBars: true
    })
  },
  {
    id: 'shed-01',
    name: 'Heavy Industrial PEB Structural Steel Shed',
    nameHi: 'हेवी इंडस्ट्रियल वेयरहाउस स्टील शेड',
    slug: 'industrial-peb-warehouse-shed',
    category: 'Sheds & Roofing',
    categoryHi: 'शेड व रूफिंग',
    categorySlug: 'sheds-roofing',
    material: 'Structural Steel I-Beams & Color-Coated Galvalume Sheets',
    priceFormatted: '₹280 / sq.ft',
    priceMinor: 28000,
    publicId: 'smart-fabrication/development/demo-stock/peb-warehouse-shed',
    tags: ['shed', 'roofing', 'peb', 'warehouse', 'factory', 'industrial', 'galvalume'],
    visualEmbedding: createProductVisualEmbedding({
      darkness: 0.45,
      edgeDensity: 0.6,
      silverMetallic: true
    })
  }
];
