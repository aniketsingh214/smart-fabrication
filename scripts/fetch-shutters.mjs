import fs from 'fs';
import crypto from 'crypto';

async function fetchSearchPins(query, sourceUrl, maxBatches = 4, pinsMap = new Map()) {
  console.log(`\n========================================`);
  console.log(`Fetching Pinterest pins for query: "${query}"`);
  console.log(`Source URL: ${sourceUrl}`);
  console.log(`========================================`);

  const getRes = await fetch('https://in.pinterest.com/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  const rawCookies = getRes.headers.getSetCookie ? getRes.headers.getSetCookie() : [getRes.headers.get('set-cookie')].filter(Boolean);
  const cookieStr = rawCookies.map(c => c.split(';')[0]).join('; ');
  const csrftokenMatch = cookieStr.match(/csrftoken=([a-zA-Z0-9_-]+)/);
  const csrftoken = csrftokenMatch ? csrftokenMatch[1] : '';

  let bookmark = null;

  for (let batch = 1; batch <= maxBatches; batch++) {
    console.log(`--- Fetching Batch ${batch} for "${query}"... ---`);
    const data = {
      options: {
        query,
        scope: 'pins',
        page_size: 25,
        ...(bookmark ? { bookmarks: [bookmark] } : {})
      },
      context: {}
    };

    const url = `https://in.pinterest.com/resource/BaseSearchResource/get/?source_url=${encodeURIComponent(sourceUrl)}&data=${encodeURIComponent(JSON.stringify(data))}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*, q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRFToken': csrftoken,
        'X-Pinterest-AppState': 'active',
        'X-Pinterest-PWS-Handler': 'www/[username].js',
        'X-APP-VERSION': 'd601c5e',
        'Cookie': cookieStr,
        'Referer': `https://in.pinterest.com${sourceUrl}`
      }
    });

    if (!res.ok) {
      console.error(`Batch ${batch} failed:`, res.status, res.statusText);
      break;
    }

    const json = await res.json();
    const results = json.resource_response?.data?.results || [];
    console.log(`Batch ${batch} returned ${results.length} pins.`);

    for (const r of results) {
      const orig = r.images?.orig?.url || r.images?.['736x']?.url || r.images?.['474x']?.url || r.images?.['236x']?.url;
      if (orig && !orig.endsWith('.heic') && !pinsMap.has(orig)) {
        pinsMap.set(orig, {
          id: r.id || crypto.randomUUID(),
          title: r.title || r.grid_title || '',
          description: r.description || '',
          imgUrl: orig,
          dominantColor: r.dominant_color || '#333333'
        });
      }
    }

    bookmark = json.resource_response?.bookmark;
    if (!bookmark || bookmark === '-end-' || results.length === 0) break;
  }

  console.log(`Current unique pins in map: ${pinsMap.size}`);
  return pinsMap;
}

async function main() {
  const pinsMap = new Map();

  // 1. User's exact query
  await fetchSearchPins('shutter', '/search/pins/?q=shutter', 4, pinsMap);

  // 2. Focused rolling shutter queries to ensure rich metal fabrication designs
  await fetchSearchPins('rolling shutter', '/search/pins/?q=rolling%20shutter', 3, pinsMap);
  await fetchSearchPins('commercial rolling shutter shop', '/search/pins/?q=commercial%20rolling%20shutter%20shop', 3, pinsMap);
  await fetchSearchPins('motorized rolling shutter', '/search/pins/?q=motorized%20rolling%20shutter', 3, pinsMap);

  const all = Array.from(pinsMap.values());
  console.log(`\n========================================`);
  console.log(`Total unique shutter pins fetched: ${all.length}`);
  console.log(`========================================`);

  fs.writeFileSync('scripts/shutter-pins.json', JSON.stringify(all, null, 2));
  console.log(`Saved ${all.length} pins to scripts/shutter-pins.json`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
