import fs from 'fs';
import crypto from 'crypto';

async function fetchSearchPins(query, sourceUrl, maxBatches = 6) {
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
    console.log(`Batch ${batch} bookmark:`, bookmark);
    if (!bookmark || bookmark === '-end-' || results.length === 0) break;
  }

  const all = Array.from(pinsMap.values());
  console.log(`Total unique pins fetched: ${all.length}`);
  return all;
}

async function main() {
  const query = 'steel relling modern design';
  const sourceUrl = '/search/pins/?q=steel%20relling%20modern%20design&rs=guide&journey_depth=1&source_module_id=OB_steel%2520relling%2520modern%2520design_bcdd2032-97e1-4e17-8ad0-cb08e92def56&add_refine=Modern%7Cguide%7Cword%7C7';

  const pins = await fetchSearchPins(query, sourceUrl, 6);
  fs.writeFileSync('scripts/modern-steel-railings-pins.json', JSON.stringify(pins, null, 2));

  console.log(`\nSaved ${pins.length} pins to scripts/modern-steel-railings-pins.json`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
