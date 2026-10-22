import fs from 'fs';
import { databaseClient } from './db-client.mjs';

const rawPins = JSON.parse(fs.readFileSync('scripts/steel-grills-all-pins.json', 'utf8'));
console.log(`Loaded ${rawPins.length} steel grill pins.`);

const descriptiveGrillStyles = [
  'Modern Geometric SS 304 Box',
  'Minimalist Horizontal Pipe',
  'Architectural Diamond Lattice',
  'Heavy-Duty French Window Safety',
  'Decorative Floral Wave Stainless',
  'Vertical Bar Anti-Burglary',
  'Contemporary Villa Balcony Safety',
  'Bespoke Cross-Hatch Security',
  'Linear Louvered Exterior',
  'Artisan Scrollwork Stainless Steel'
];

function cleanGrillTitle(pin, index) {
  let title = (pin.title || '').trim();
  title = title.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

  // Remove non-latin or weird characters if mostly non-ascii
  const asciiCount = (title.match(/[a-zA-Z0-9]/g) || []).length;
  if (asciiCount < 4) {
    title = '';
  }

  const lower = title.toLowerCase();
  if (!title || title.length < 5) {
    const style = descriptiveGrillStyles[index % descriptiveGrillStyles.length];
    title = `${style} Window Grill ${index + 1}`;
  }

  // Capitalize nicely
  title = title.charAt(0).toUpperCase() + title.slice(1);
  if (title.length > 70) {
    title = title.slice(0, 67).trim() + '...';
  }

  return title;
}

function getGrillSubcategory(title, pin) {
  const text = (title + ' ' + (pin.description || '')).toLowerCase();
  if (text.includes('laser') || text.includes('cnc') || text.includes('cutting')) {
    return 'laser-cut-grills';
  }
  if (text.includes('balcony') || text.includes('railing') || text.includes('terrace')) {
    return 'balcony-safety-grills';
  }
  if (text.includes('ss') || text.includes('stainless') || text.includes('304')) {
    return 'ss-window-grills';
  }
  return 'modern-window-grills';
}

const prepared = rawPins.map((p, idx) => {
  const title = cleanGrillTitle(p, idx);
  const subSlug = getGrillSubcategory(title, p);
  return {
    index: idx + 1,
    title,
    subSlug,
    imgUrl: p.imgUrl
  };
});

console.log('Sample prepared grills:');
console.log(prepared.slice(0, 8));

const breakdown = {};
prepared.forEach(p => {
  breakdown[p.subSlug] = (breakdown[p.subSlug] || 0) + 1;
});
console.log('Subcategory breakdown:', breakdown);
