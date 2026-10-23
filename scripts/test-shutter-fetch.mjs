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
      const text = await res.text();
      console.error('Response text snippet:', text.slice(0, 200));
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

  const all = Array.from(pinsMap.values());
  console.log(`Total unique pins fetched: ${all.length}`);
  return all;
}

async function main() {
  const query = 'rolling shutter design';
  const sourceUrl = '/search/pins/?q=rolling%20shutter%20design';

  const pins = await fetchSearchPins(query, sourceUrl, 4);
  console.log(`Sample titles from fetched pins:`);
  pins.slice(0, 5).forEach((p, i) => console.log(`${i + 1}. [${p.title}] - ${p.imgUrl}`));
}

main().catch(console.error);
