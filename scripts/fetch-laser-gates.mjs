import fs from 'fs';

async function fetchLaserCuttingGates() {
  console.log('--- Handshake with Pinterest ---');
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

  console.log('CSRF Token:', csrftoken);

  const pinsMap = new Map();
  let bookmark = null;
  const maxBatches = 2; // ~50 pins
  const sourceUrl = `/search/pins/?q=laser%20cutting%20iron%20gate`;

  for (let batch = 1; batch <= maxBatches; batch++) {
    console.log(`\n--- Fetching Batch ${batch}... ---`);
    const data = {
      options: {
        query: 'laser cutting iron gate',
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

    for (const pin of results) {
      if (!pin.id || pinsMap.has(pin.id)) continue;
      const img = pin.images?.orig?.url || pin.images?.['736x']?.url || pin.images?.['474x']?.url;
      if (!img) continue;

      const title = pin.title || pin.grid_title || pin.closeup_unified_description || '';
      pinsMap.set(pin.id, {
        id: pin.id,
        title,
        description: pin.description || '',
        imageUrl: img,
        dominantColor: pin.dominant_color || '#333333',
        width: pin.images?.orig?.width || 736,
        height: pin.images?.orig?.height || 980
      });
    }

    bookmark = json.resource_response?.bookmark;
    if (!bookmark || bookmark === '-end-') break;
  }

  const allPins = Array.from(pinsMap.values());
  console.log(`\nTotal unique laser cutting iron gate pins extracted: ${allPins.length}`);
  fs.writeFileSync('scripts/laser-cutting-gate-pins.json', JSON.stringify(allPins, null, 2));
  console.log('Saved to scripts/laser-cutting-gate-pins.json');
}

fetchLaserCuttingGates().catch(console.error);
