import fs from 'fs';

const raw = fs.readFileSync('scripts/pinterest-all-pins.json', 'utf8');
const pins = JSON.parse(raw);

console.log(`Total pins in scripts/pinterest-all-pins.json: ${pins.length}`);

const shutterPins = pins.filter(p => {
  const text = (p.title + ' ' + p.description + ' ' + (p.link || '')).toLowerCase();
  return text.includes('shutter') || text.includes('roller') || text.includes('rolling');
});

console.log(`Pins matching "shutter" / "roller" / "rolling": ${shutterPins.length}`);
shutterPins.forEach((p, i) => {
  console.log(`${i + 1}. [Pin ID: ${p.id}] "${p.title}" | Desc: "${p.description.slice(0, 80)}" | Img: ${p.imgUrl}`);
});

console.log('\n--- All other pins in the list ---');
pins.filter(p => !shutterPins.includes(p)).forEach((p, i) => {
  console.log(`${i + 1}. [${p.id}] "${p.title}" | Desc: "${p.description.slice(0, 60)}"`);
});
