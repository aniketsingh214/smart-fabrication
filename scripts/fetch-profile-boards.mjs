async function fetchProfile() {
  const res = await fetch('https://in.pinterest.com/anirajpoot789/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  const html = await res.text();
  const jsonMatch = html.match(/<script id="__PWS_INITIAL_PROPS__"[^>]*>([\s\S]*?)<\/script>/);

  if (jsonMatch) {
    const json = JSON.parse(jsonMatch[1]);
    const state = json.initialReduxState || {};
    console.log('Resource keys:', Object.keys(state.resources || {}));
    console.log('Pins in state:', Object.keys(state.pins || {}).length);
    for (const [id, pin] of Object.entries(state.pins || {})) {
      console.log(`- [${id}] "${pin.title || pin.grid_title}" | ${pin.images?.orig?.url || pin.images?.['736x']?.url}`);
    }
  } else {
    console.log('No script tag found');
  }
}

fetchProfile().catch(console.error);
