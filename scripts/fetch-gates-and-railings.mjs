import fs from 'fs';
import crypto from 'crypto';

async function fetchSearchPins(query, sourceUrl, maxBatches = 3) {
  console.log(`\n========================================`);
  console.log(`Fetching Pinterest pins for query: "${query}"`);
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

  const pinsMap = new Map();
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
      // Skip unsupported heic
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

  const all = Array.from(pinsMap.values());
  console.log(`Total unique pins for "${query}": ${all.length}`);
  return all;
}

async function main() {
  const steelGates = await fetchSearchPins(
    'steel gate design',
    '/search/pins/?q=steel%20gate%20design&rs=ac&len=10&source_id=ac_LVz2YAff&eq=steel%20gate&etslf=6286',
    3
  );
  fs.writeFileSync('scripts/steel-gates-search-pins.json', JSON.stringify(steelGates, null, 2));

  const steelRailings = await fetchSearchPins(
    'steel railing design',
    '/search/pins/?q=steel%20relling%20design&rs=ac&len=13&source_id=ac_X8H1x9qZ&eq=steel%20relling&etslf=6135',
    3
  );
  fs.writeFileSync('scripts/steel-railings-search-pins.json', JSON.stringify(steelRailings, null, 2));

  console.log('\n========================================');
  console.log(`FETCH SUMMARY:`);
  console.log(`Steel Gates: ${steelGates.length} pins`);
  console.log(`Steel Railings: ${steelRailings.length} pins`);
  console.log(`========================================`);
}

main().catch(console.error);
