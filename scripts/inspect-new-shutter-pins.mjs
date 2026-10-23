import fs from 'fs';

const pinIds = [
  '1140466305672357403',
  '1140466305672357396',
  '1140466305672357268',
  '1140466305672357260',
  '1140466305672357257',
  '1140466305672357232',
  '1140466305672357230',
  '1140466305672357226',
  '1140466305672357212',
  '1140466305672357207',
  '1140466305672357201',
  '1140466305672357190',
  '1140466305672357186',
  '1140466305672357183',
  '1140466305672357180',
  '1140466305672357148',
  '1140466305672357146',
  '1140466305672357141'
];

async function inspectPins() {
  console.log(`Inspecting ${pinIds.length} new pins saved by anirajpoot789...`);

  const results = [];
  for (const id of pinIds) {
    try {
      const res = await fetch(`https://in.pinterest.com/pin/${id}/`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      });
      const html = await res.text();
      const pMatch = html.match(/<script id="__PWS_INITIAL_PROPS__"[^>]*>([\s\S]*?)<\/script>/) ||
                     html.match(/<script id="__PWS_DATA__"[^>]*>([\s\S]*?)<\/script>/);

      let title = '';
      let desc = '';
      let img = '';

      if (pMatch) {
        const json = JSON.parse(pMatch[1]);
        const state = json.props?.initialReduxState || json.initialReduxState || {};
        const pin = state.pins?.[id] || Object.values(state.pins || {})[0];
        if (pin) {
          title = pin.title || pin.grid_title || '';
          desc = pin.description || '';
          img = pin.images?.orig?.url || pin.images?.['736x']?.url || '';
        }
      }

      if (!title) {
        const ogTitle = html.match(/<meta property="og:title" content="([^"]*)"/i);
        if (ogTitle) title = ogTitle[1];
      }
      if (!img) {
        const ogImg = html.match(/<meta property="og:image" content="([^"]*)"/i);
        if (ogImg) img = ogImg[1];
      }
      if (!desc) {
        const ogDesc = html.match(/<meta property="og:description" content="([^"]*)"/i);
        if (ogDesc) desc = ogDesc[1];
      }

      console.log(`[${id}] "${title}"\n  Img: ${img}\n  Desc: ${desc.slice(0, 100)}\n`);
      results.push({ id, title, desc, img });
    } catch (e) {
      console.error(`Error on pin ${id}:`, e.message);
    }
  }

  fs.writeFileSync('scripts/user-saved-shutters.json', JSON.stringify(results, null, 2));
  console.log('Saved to scripts/user-saved-shutters.json');
}

inspectPins().catch(console.error);
