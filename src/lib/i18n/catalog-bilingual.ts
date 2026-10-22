import type { Locale } from './types';

export const CATEGORY_TRANSLATIONS: Record<string, { hi: string; en: string }> = {
  'main-gates': {
    hi: 'मुख्य गेट (Main Gates)',
    en: 'Main Gates & Entry Gates'
  },
  railings: {
    hi: 'रेलिंग (Stair & Balcony Railings)',
    en: 'Stair & Balcony Railings'
  },
  'window-grills': {
    hi: 'खिड़की की जाली (Window Grills)',
    en: 'Safety Window Grills'
  },
  'rolling-shutters': {
    hi: 'दुकान का शटर (Rolling Shutters)',
    en: 'Commercial Rolling Shutters'
  },
  'industrial-sheds': {
    hi: 'शेड और छत (Roofing Sheds)',
    en: 'Sheds & Roofing'
  },
  'metal-doors': {
    hi: 'स्टील व सुरक्षा दरवाजे (Security Doors)',
    en: 'Steel & Security Doors'
  },
  'custom-fabrication': {
    hi: 'कस्टम काम (Custom Fabrication)',
    en: 'Custom Metal Fabrication'
  }
};

export function getCategoryDisplayName(slugOrName: string, defaultName: string, locale: Locale): string {
  const normalized = slugOrName.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_TRANSLATIONS)) {
    if (normalized.includes(key) || defaultName.toLowerCase().includes(key)) {
      return locale === 'hi' ? val.hi : val.en;
    }
  }
  return defaultName;
}

export function getBilingualProductName(name: string, locale: Locale): string {
  if (locale === 'en') return name;

  // If already contains Devanagari Hindi characters, return as is
  if (/[\u0900-\u097F]/.test(name)) return name;

  const lower = name.toLowerCase();

  if (lower.includes('gate')) {
    if (lower.includes('ss') || lower.includes('stainless') || lower.includes('steel')) {
      return `स्टील का मेन गेट (${name})`;
    }
    if (lower.includes('pipe') || lower.includes('iron') || lower.includes('ms')) {
      return `लोहे का मेन गेट (${name})`;
    }
    return `मेन गेट (${name})`;
  }

  if (lower.includes('railing') || lower.includes('baluster')) {
    if (lower.includes('glass')) {
      return `कांच व स्टील रेलिंग (${name})`;
    }
    return `स्टील रेलिंग (${name})`;
  }

  if (lower.includes('grill') || lower.includes('window')) {
    return `खिड़की की जाली (${name})`;
  }

  if (lower.includes('shutter')) {
    return `दुकान का शटर (${name})`;
  }

  if (lower.includes('shed') || lower.includes('roof')) {
    return `टीन शेड व स्ट्रक्चर (${name})`;
  }

  if (lower.includes('door')) {
    return `स्टील / लोहे का दरवाजा (${name})`;
  }

  if (lower.includes('pergola')) {
    return `मेटल शेड / परगोला (${name})`;
  }

  if (lower.includes('staircase')) {
    return `लोहे / स्टील का जीना (${name})`;
  }

  return name;
}

export function getBilingualMaterial(material: string, locale: Locale): string {
  if (locale === 'en') return material;

  const lower = material.toLowerCase();
  if (lower.includes('ss 304') || lower.includes('stainless steel 304')) {
    return 'स्टेनलेस स्टील 304 (SS 304) • जंग-रोधी';
  }
  if (lower.includes('stainless')) {
    return 'स्टेनलेस स्टील (SS)';
  }
  if (lower.includes('wrought iron') || lower.includes('wrought')) {
    return 'गढ़ा लोहा (Wrought Iron)';
  }
  if (lower.includes('mild steel') || lower.includes('ms')) {
    return 'मजबूत लोहा (Mild Steel)';
  }
  if (lower.includes('glass')) {
    return 'टफन ग्लास और स्टील (Toughened Glass & Steel)';
  }
  if (lower.includes('steel') || lower.includes('iron')) {
    return 'स्टील / मजबूत लोहा';
  }
  return material;
}

/**
 * Expand Hindi search keywords to matching English database terms so searches work seamlessly
 */
export function expandSearchQuery(q: string): string[] {
  const trimmed = q.trim().toLowerCase();
  const queries = [q];

  const map: Record<string, string[]> = {
    गेट: ['gate'],
    'मेन गेट': ['main gate', 'gate'],
    'लोहे का गेट': ['iron', 'gate', 'pipe'],
    'स्टील गेट': ['steel', 'gate', 'ss'],
    जाली: ['grill', 'window'],
    'खिड़की': ['window', 'grill'],
    'खिड़की की जाली': ['window grill', 'grill'],
    रेलिंग: ['railing'],
    'सीढ़ी': ['staircase', 'railing'],
    शटर: ['shutter'],
    लोहा: ['steel', 'iron', 'ms'],
    स्टील: ['steel', 'ss'],
    दरवाजा: ['door'],
    शेड: ['shed'],
    जीना: ['staircase']
  };

  for (const [hiTerm, enTerms] of Object.entries(map)) {
    if (trimmed.includes(hiTerm)) {
      queries.push(...enTerms);
    }
  }

  return Array.from(new Set(queries));
}
