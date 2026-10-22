import fs from 'fs';

async function fetchAllSteelGrills() {
  console.log('--- Step 1: Handshake with Pinterest ---');
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

  console.log('Handshake successful. CSRF Token:', csrftoken);

  const pinsMap = new Map();
  let bookmark = null;
  const maxBatches = 3; // ~60-75 pins
  const sourceUrl = `/search/pins/?q=steel%20grill%20design`;

  for (let batch = 1; batch <= maxBatches; batch++) {
    console.log(`\n--- Fetching Batch ${batch}... ---`);
    const data = {
      options: {
        query: 'steel grill design',
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
      if (orig && !pinsMap.has(orig)) {
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
    console.log(`Next bookmark:`, bookmark);
    if (!bookmark || bookmark === '-end-' || results.length === 0) break;
  }

  const allPins = Array.from(pinsMap.values());
  console.log(`\n========================================`);
  console.log(`TOTAL UNIQUE STEEL GRILL PINS FETCHED: ${allPins.length}`);
  console.log(`========================================`);

  fs.writeFileSync('scripts/steel-grills-all-pins.json', JSON.stringify(allPins, null, 2));
  console.log('Saved to scripts/steel-grills-all-pins.json');
}

fetchAllSteelGrills().catch(console.error);
