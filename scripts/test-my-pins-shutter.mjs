async function main() {
  const url = 'https://in.pinterest.com/search/my_pins/?q=shutter&rs=filter';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  console.log('Status:', res.status, res.statusText);
  const html = await res.text();
  console.log('HTML length:', html.length);
  const jsonMatch = html.match(/<script id="__PWS_INITIAL_PROPS__"[^>]*>([\s\S]*?)<\/script>/);
  if (jsonMatch) {
    console.log('Found __PWS_INITIAL_PROPS__!');
    const props = JSON.parse(jsonMatch[1]);
    const state = props.initialReduxState || {};
    console.log('Keys in state:', Object.keys(state));
    console.log('Pins count:', Object.keys(state.pins || {}).length);
    console.log('Resources:', Object.keys(state.resources || {}));
    for (const [id, pin] of Object.entries(state.pins || {})) {
      console.log(`- [${id}] "${pin.title || pin.grid_title}" | img: ${pin.images?.orig?.url || pin.images?.['736x']?.url}`);
    }
  } else {
    console.log('Could not find __PWS_INITIAL_PROPS__');
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    console.log('Title:', titleMatch ? titleMatch[1] : 'No title');
  }
}

main().catch(console.error);
