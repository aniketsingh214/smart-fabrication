import { databaseClient } from './db-client.mjs';

async function main() {
  const db = databaseClient();
  await db.connect();

  console.log('1. Identifying unrelated non-project items...');

  // Specific media public_ids that were identified as non-fabrication memes/toilets/cabinets
  const badPublicIds = [
    'smart-fabrication/development/commercial-shutters/item-be9641',
    'smart-fabrication/development/commercial-shutters/item-19470b',
    'smart-fabrication/development/commercial-shutters/item-524b4d',
    'smart-fabrication/development/commercial-shutters/item-cab533',
    'smart-fabrication/development/commercial-shutters/item-d91e06',
    'smart-fabrication/development/commercial-shutters/item-f65872',
    'smart-fabrication/development/commercial-shutters/item-314de8',
    'smart-fabrication/development/commercial-shutters/item-7aa09c',
    'smart-fabrication/development/commercial-shutters/item-ea640b',
    'smart-fabrication/development/commercial-shutters/item-b5ec4a',
    'smart-fabrication/development/commercial-shutters/item-74365d',
    'smart-fabrication/development/commercial-shutters/item-8da666',
    'smart-fabrication/development/commercial-shutters/item-f5bbae',
    'smart-fabrication/development/commercial-shutters/item-a0ddf7',
    'smart-fabrication/development/commercial-shutters/item-221a37',
    'smart-fabrication/development/commercial-shutters/item-e8d8b4'
  ];

  // Also find gallery_items with spam/unrelated titles
  const badPatterns = [
    '%toilet%', '%outhouse%', '%shittin%', '%shitler%', '%cakhia%',
    '%restroom%', '%bathroom%', '%kitchen cabinet%', '%powder room%',
    '%sandtraps%', '%stuttering%', '%slayed%', '%yes guys%'
  ];

  const galleryItemsToDelete = await db.query(`
    select gi.id, gi.name, ma.public_id, gi.media_id
    from public.gallery_items gi
    left join public.media_assets ma on ma.id = gi.media_id
    where ma.public_id = any($1)
       or gi.name ilike any($2)
  `, [badPublicIds, badPatterns]);

  console.log(`Found ${galleryItemsToDelete.rows.length} gallery items to delete:`);
  galleryItemsToDelete.rows.forEach(r => console.log(` - [${r.name}] (${r.public_id})`));

  const galleryIds = galleryItemsToDelete.rows.map(r => r.id);
  if (galleryIds.length > 0) {
    await db.query(`delete from public.gallery_items where id = any($1)`, [galleryIds]);
    console.log(`Deleted ${galleryIds.length} unrelated gallery items.`);
  }

  // Find products linked to these bad media assets
  const productsToDelete = await db.query(`
    select p.id, p.sku, p.name, ma.public_id
    from public.products p
    join public.product_media pm on pm.product_id = p.id
    join public.media_assets ma on ma.id = pm.media_id
    where ma.public_id = any($1)
  `, [badPublicIds]);

  console.log(`\nFound ${productsToDelete.rows.length} products to delete:`);
  productsToDelete.rows.forEach(r => console.log(` - [${r.sku}] ${r.name} (${r.public_id})`));

  const productIds = productsToDelete.rows.map(r => r.id);
  if (productIds.length > 0) {
    // Delete variants
    await db.query(`delete from public.product_variants where product_id = any($1)`, [productIds]);
    // Delete product_media
    await db.query(`delete from public.product_media where product_id = any($1)`, [productIds]);
    // Delete calculation_rules
    await db.query(`delete from public.calculation_rules where product_id = any($1)`, [productIds]);
    // Delete bom_items & bom_versions
    const boms = await db.query(`select id from public.bom_versions where product_id = any($1)`, [productIds]);
    const bomIds = boms.rows.map(b => b.id);
    if (bomIds.length > 0) {
      await db.query(`delete from public.bom_items where bom_id = any($1)`, [bomIds]);
      await db.query(`delete from public.bom_versions where id = any($1)`, [bomIds]);
    }
    // Delete products
    await db.query(`delete from public.products where id = any($1)`, [productIds]);
    console.log(`Deleted ${productIds.length} unrelated products and their child records.`);
  }

  // Delete media_assets & upload_intents for bad public IDs
  const mediaRes = await db.query(`select id, public_id from public.media_assets where public_id = any($1)`, [badPublicIds]);
  const mediaIds = mediaRes.rows.map(m => m.id);
  if (mediaIds.length > 0) {
    await db.query(`delete from public.media_assets where id = any($1)`, [mediaIds]);
    await db.query(`delete from public.upload_intents where public_id = any($1)`, [badPublicIds]);
    console.log(`Deleted ${mediaIds.length} media assets and upload intents.`);
  }

  // Update gallery item names to match product names cleanly where needed
  console.log('\n2. Synchronizing gallery titles with clean product titles...');
  await db.query(`
    update public.gallery_items gi
    set name = p.name, alt_text = p.name
    from public.product_media pm
    join public.products p on p.id = pm.product_id
    where pm.media_id = gi.media_id
      and gi.name != p.name
  `);

  const finalGallery = await db.query(`select count(*) from public.gallery_items`);
  const finalProducts = await db.query(`select count(*) from public.products where status = 'published'`);
  const finalMedia = await db.query(`select count(*) from public.media_assets`);

  console.log('\n========================================');
  console.log('CLEANUP COMPLETE!');
  console.log(`Published Products: ${finalProducts.rows[0].count}`);
  console.log(`Gallery Items in "Our Work": ${finalGallery.rows[0].count}`);
  console.log(`Total Media Assets: ${finalMedia.rows[0].count}`);
  console.log('========================================');

  await db.end();
}

main().catch(console.error);
