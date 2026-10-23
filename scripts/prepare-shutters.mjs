import fs from 'fs';

const rawPins = JSON.parse(fs.readFileSync('scripts/shutter-pins.json', 'utf8'));

const badKeywords = [
  'meme', 'slayed', 'camera', 'photography', 'lens', 'shitter', 'makeup',
  'nail', 'hair', 'anime', 'cosplay', 'dress', 'shoe', 'shirt', 'pants',
  'tshirt', 'jeans', 'skirt', 'curtain', 'wooden blind', 'fabric blind'
];

const validPins = rawPins.filter(p => {
  const text = (p.title + ' ' + (p.description || '')).toLowerCase();
  for (const b of badKeywords) {
    if (text.includes(b)) return false;
  }
  return true;
});

// Take top 100 high-quality unique pins
const selectedPins = validPins.slice(0, 100);

console.log(`Raw pins: ${rawPins.length}`);
console.log(`Valid pins: ${validPins.length}`);
console.log(`Selected for upload: ${selectedPins.length}`);

fs.writeFileSync('scripts/prepared-shutters.json', JSON.stringify(selectedPins, null, 2));
