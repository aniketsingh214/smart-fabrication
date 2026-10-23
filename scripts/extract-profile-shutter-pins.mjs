import fs from 'fs';

async function extract() {
  const res = await fetch('https://in.pinterest.com/anirajpoot789/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  const html = await res.text();
  const jsonMatch = html.match(/<script id="__PWS_INITIAL_PROPS__"[^>]*>([\s\S]*?)<\/script>/);

  if (!jsonMatch) {
    throw new Error('No __PWS_INITIAL_PROPS__ found');
  }

  const json = JSON.parse(jsonMatch[1]);
  const state = json.initialReduxState || {};
  const pinsObj = state.pins || {};

  const shutterPins = [];
  for (const [id, pin] of Object.entries(pinsObj)) {
    // Only the new shutter batch (ID starting with 1140466305672357)
    if (id.startsWith('1140466305672357')) {
      const orig = pin.images?.orig?.url || pin.images?.['736x']?.url || pin.images?.['474x']?.url || pin.images?.['236x']?.url;
      shutterPins.push({
        id,
        title: pin.title || pin.grid_title || '',
        description: pin.description || '',
        imgUrl: orig,
        width: pin.images?.orig?.width || 800,
        height: pin.images?.orig?.height || 600,
        dominantColor: pin.dominant_color || '#2d3748'
      });
    }
  }

  console.log(`Found ${shutterPins.length} newly saved shutter pins on profile:`);
  shutterPins.forEach((p, i) => {
    console.log(`${i + 1}. [${p.id}] "${p.title}"\n   Image: ${p.imgUrl}\n   Desc: ${p.description.slice(0, 80)}\n`);
  });

  fs.writeFileSync('scripts/anirajpoot-shutter-pins.json', JSON.stringify(shutterPins, null, 2));
}

extract().catch(console.error);
