import fs from 'fs';

const html = fs.readFileSync('scripts/anirajpoot-profile.html', 'utf8');
const pMatch = html.match(/<script id="__PWS_DATA__"[^>]*>([\s\S]*?)<\/script>/);

if (pMatch) {
  const json = JSON.parse(pMatch[1]);
  const str = JSON.stringify(json);
  console.log('Includes shutter:', str.toLowerCase().includes('shutter'));
  console.log('Includes rolling:', str.toLowerCase().includes('rolling'));

  // Look for pin IDs or board names
  const boards = json.props?.initialReduxState?.resources?.BoardFeedResource || {};
  console.log('BoardFeedResource keys:', Object.keys(boards));

  const userBoards = json.props?.initialReduxState?.resources?.UserBoardsResource || {};
  console.log('UserBoardsResource keys:', Object.keys(userBoards));

  const pins = json.props?.initialReduxState?.resources?.UserPinsResource || {};
  console.log('UserPinsResource keys:', Object.keys(pins));

  for (const [k, v] of Object.entries(userBoards)) {
    console.log('Board data for key:', k, v.data?.map(b => ({ name: b.name, url: b.url, pinCount: b.pin_count })));
  }
}
