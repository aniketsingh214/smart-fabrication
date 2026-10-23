import fs from 'fs';
import crypto from 'crypto';

async function fetchSearchPins(query, sourceUrl, maxBatches = 2) {
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

    if (!res.ok) break;

    const json = await res.json();
    const results = json.resource_response?.data?.results || [];

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

  return Array.from(pinsMap.values());
}

async function main() {
  const queries = [
    { q: 'shutter', s: '/search/pins/?q=shutter' },
    { q: 'rolling shutter shop', s: '/search/pins/?q=rolling%20shutter%20shop' },
    { q: 'commercial rolling shutter', s: '/search/pins/?q=commercial%20rolling%20shutter' },
    { q: 'motorized rolling shutter', s: '/search/pins/?q=motorized%20rolling%20shutter' }
  ];

  for (const item of queries) {
    const pins = await fetchSearchPins(item.q, item.s, 2);
    console.log(`\nQuery: "${item.q}" -> ${pins.length} pins`);
    pins.slice(0, 4).forEach((p, i) => console.log(`  ${i + 1}. [${p.title || 'Untitled'}] - ${(p.description || '').slice(0, 60)}`));
  }
}

main().catch(console.error);
