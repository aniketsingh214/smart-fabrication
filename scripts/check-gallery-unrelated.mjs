import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  const res = await db.query(`
    select gi.id, gi.name, gi.alt_text, c.slug as category_slug, ma.public_id
    from public.gallery_items gi
    left join public.categories c on c.id = gi.category_id
    left join public.media_assets ma on ma.id = gi.media_id
    order by gi.name asc
  `);

  console.log(`Total gallery items: ${res.rows.length}`);

  const badItems = [];
  const goodItems = [];

  const badPatterns = [
    /toilet/i, /outhouse/i, /shittin/i, /shitler/i, /cakhia/i, /trực tiếp/i, /bóng đá/i,
    /restroom/i, /bathroom/i, /kitchen cabinet/i, /makeup/i, /nail/i, /hair/i, /cosplay/i,
    /anime/i, /dress/i, /shoe/i, /pants/i, /skirt/i, /jeans/i, /tshirt/i, /shark/i, /sandtraps/i,
    /slayed/i, /yes guys/i, /stuttering/i, /very normal/i, /and it’s all/i, /and it's all/i,
    /dbr 24/i, /powder room/i, /black glass/i, /cakhia/i
  ];

  for (const item of res.rows) {
    const text = (item.name + ' ' + (item.alt_text || '') + ' ' + (item.public_id || '')).toLowerCase();
    let isBad = false;
    for (const pat of badPatterns) {
      if (pat.test(text)) {
        isBad = true;
        break;
      }
    }
    if (isBad) {
      badItems.push(item);
    } else {
      goodItems.push(item);
    }
  }

  console.log(`Good fabrication items: ${goodItems.length}`);
  console.log(`Unrelated / non-project items to delete: ${badItems.length}`);
  console.log('\nUnrelated items:');
  badItems.forEach(b => console.log(`- ID: ${b.id} | Name: "${b.name}" | Media: ${b.public_id}`));

  await db.end();
}

main().catch(console.error);
