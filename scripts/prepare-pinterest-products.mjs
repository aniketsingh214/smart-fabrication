import fs from 'fs';

const pins = JSON.parse(fs.readFileSync('scripts/pinterest-all-pins.json', 'utf8'));

console.log(`Loaded ${pins.length} pins.`);

function cleanTitle(pin, index) {
  let title = (pin.title || '').trim();
  // remove emojis and weird characters
  title = title.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

  // Remove phone numbers or URLs
  title = title.replace(/\b\d{10}\b/g, '').replace(/cel\s*\d+/gi, '').trim();

  const lower = title.toLowerCase();
  const desc = (pin.description || '').toLowerCase();

  // If title is too short or generic or empty, infer from context
  if (!title || title.length < 5 || title === 'C' || lower.includes('mercado libre') || lower.includes('real estate photo editing')) {
    if (lower.includes('door') || desc.includes('door')) {
      title = `Architectural Iron Security Door ${index + 1}`;
    } else if (lower.includes('steel') || desc.includes('steel')) {
      title = `Modern Stainless Steel Main Gate ${index + 1}`;
    } else {
      title = `Designer Iron Pipe Entrance Gate ${index + 1}`;
    }
  }

  // Cap length
  if (title.length > 70) {
    title = title.slice(0, 67).trim() + '...';
  }

  return title;
}

function getCategory(pin, title) {
  const text = (title + ' ' + (pin.description || '')).toLowerCase();

  if (text.includes('door') || text.includes('puerta') || text.includes('puertas') || text.includes('porte') || text.includes('entrance door') || text.includes('security door')) {
    return 'metal-doors';
  }
  if (text.includes('jali') || text.includes('laser cut') || text.includes('cnc')) {
    return 'laser-cut-gates';
  }
  if (text.includes('steel') || text.includes('ss 304') || text.includes('ss get')) {
    return 'steel-gates';
  }
  if (text.includes('sliding') || text.includes('motorized')) {
    return 'sliding-gates';
  }
  return 'iron-pipe-gates';
}

const prepared = pins.map((p, idx) => {
  const title = cleanTitle(p, idx);
  const categorySlug = getCategory(p, title);
  const sku = `PIN-${categorySlug.toUpperCase().slice(0, 4)}-${String(idx + 1).padStart(3, '0')}`;
  const slug = `pin-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${p.id.slice(-6)}`;

  return {
    pinId: p.id,
    sku,
    slug,
    title,
    categorySlug,
    imgUrl: p.imgUrl,
    dominantColor: p.dominantColor
  };
});

console.log('Sample prepared products (first 10):');
console.log(prepared.slice(0, 10));

const counts = {};
prepared.forEach(p => {
  counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1;
});
console.log('Category distribution:', counts);
fs.writeFileSync('scripts/prepared-pinterest-products.json', JSON.stringify(prepared, null, 2));
