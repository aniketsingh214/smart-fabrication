import fs from 'fs';

async function testUrl() {
  const targetUrl = 'https://in.pinterest.com/search/my_pins/?q=shutter&rs=rs&source_id=rs_k8J1g6Oq&eq=&etslf=3565';
  console.log('Fetching HTML from:', targetUrl);
  
  const res = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  console.log('Status:', res.status, res.statusText);
  console.log('Final URL:', res.url);
  const html = await res.text();
  console.log('HTML length:', html.length);
  
  // Look for pin data or JSON state in HTML
  const jsonMatch = html.match(/<script id="__PWS_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (jsonMatch) {
    console.log('Found __PWS_DATA__ script!');
    fs.writeFileSync('scripts/shutter-pws-data.json', jsonMatch[1]);
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      console.log('Keys in parsed PWS data:', Object.keys(parsed));
      if (parsed.props?.initialReduxState) {
        console.log('Redux state keys:', Object.keys(parsed.props.initialReduxState));
      }
    } catch (e) {
      console.log('Error parsing PWS json:', e.message);
    }
  } else {
    console.log('No __PWS_DATA__ found. Checking for initial data...');
    const pinMatches = html.match(/https:\/\/i\.pinimg\.com\/[^\s"']+/g) || [];
    console.log('Image URLs found in HTML:', pinMatches.length);
  }
}

testUrl().catch(console.error);
