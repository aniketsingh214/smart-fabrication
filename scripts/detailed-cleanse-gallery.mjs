import { databaseClient } from './db-client.mjs';

// List of gallery_item IDs that are non-project, spam, memes, furniture, or foreign ads
const DELETE_IDS = [
  '00b0bb10-1102-433a-97a9-50146afc9f58', // #تركيب_شتر_نوافذ_كهربائي_ريموت (Arabic hashtag)
  'db30e85f-d973-44ed-9a85-f8fb0c5b487f', // Bob Burns Blinds, Shutters & Curtains Adelaide
  'b9893e88-ea14-4f5d-bae0-a070089da50d', // En suite (Bathroom)
  'ac15c291-d874-408e-a458-737633358b33', // How I feel being walked in on while I'm taking a dump (Toilet meme)
  'b97d82e8-edb2-4e31-883c-be4103d2d7db', // How to pick the best roller shutters (Blog post)
  '77e257c7-555b-4d2b-ad84-a5abd906e6c8', // Nikhil Satpute (@learnwithnikhil) • Instagram phot (Instagram profile)
  'b585a5d5-cacb-4251-9aa3-367b4447d824', // Oh, man (Meme)
  'c604ef91-97cb-48d1-928f-5105220e8278', // Ozone Roller Shutter | Ozone Kitchen Fittings (Kitchen fitting)
  '034d4663-3748-4fbc-ba1b-0ca0a0e84158', // RIDALCO | Stainless Steel Non-Kitchen Ideas (Blog graphic)
  '4ba38dc4-123e-434d-a56e-dd57ce2aa288', // Rolling Shutter Cabinet for Kitchen (Kitchen cabinet)
  '2b35b0ce-2a28-4121-bf17-adeca31aaf9f', // SS RAILINGS| GURUKRUPA AGENCY| 9951199119 (Agency ad with phone)
  'a9c5fef3-3869-4bbf-87da-234ee8b4467b', // Hebrew wood railing
  'ba28f207-47f9-4740-a578-eb779cd717a7', // Hebrew wood railing
  'c07f225b-3345-41bf-8606-13c7d3ae8e6b', // Saudi phone ad
  'd71c868b-0d1c-44d2-a1b7-2f97d1f2d197', // EHKAMMETAL website ad
  '2f4555fc-9981-40c9-a86e-87f1020b38c3', // Malayalam hashtag ad
  '0761b420-3a12-400f-ad3a-48c85288bc2c', // Vietnamese local ad
  'cd7aaf2f-f2b7-4de6-9cc2-eee6631a5360', // Vietnamese blog post
  '32bd2897-45be-4e32-bb0e-e04fa85cbac2', // Polish ad
  '99ed0d98-5c06-402a-8fa8-13b1119411d6', // Polish ad
  'ca829fe3-acf7-495b-bfd5-c2e26c58fa13', // Flickr tourist photo
  '4177e642-f283-4d2d-bbb6-2dd8b357c11e', // Ironman Security competitor
  '139869a9-fd57-4ed2-83e8-c2b70c45d061', // Sharif Ahmad welding competitor
  '358e324d-4cee-4fd2-a33f-0ed3f1022f6d', // Jangid railings competitor
  'bba344f7-f695-411d-ad1d-d6dc35cf8a1c', // Sharani Ss works competitor
  '6a986ee0-bc0e-43dd-ad1f-b923aa70f91d', // Aryan Steel Art competitor
  '6f16f3a7-8c94-493a-b25d-2f87dfcf22c7', // Cain Builders competitor
  '6c966606-331e-4d30-af1c-7886803a2efa', // Chouhan steel furniture competitor
  'c8ff72e0-a5d4-4355-aa8b-fce9e9ef97e6', // Chouhan steel furniture competitor
  '9cb31ff1-e1cf-4c3f-9c1e-533dfa13c729', // London roller shutter competitor
  'b588fa45-5662-478f-8938-5d67da5f8ae8', // Adelaide security doors competitor
  '4be0d981-97b5-430e-8912-7006521a0d5e', // Tucson security doors competitor
  '13909fd7-97b5-4d09-a354-f844f5f3fadd', // Milpitas CA automatic gates competitor
  '3d54023d-98e9-4df0-9e32-a5f9731f6a88'  // Hrsteel_work competitor
];

async function main() {
  const db = databaseClient();
  await db.connect();

  console.log(`Deleting ${DELETE_IDS.length} confirmed unrelated/competitor items from gallery_items...`);
  const delRes = await db.query(`DELETE FROM public.gallery_items WHERE id = ANY($1::uuid[]) RETURNING id, name`, [DELETE_IDS]);
  console.log(`Deleted ${delRes.rowCount} items from public.gallery_items.`);

  // Also archive any corresponding products in public.products so they do not show in catalog either
  const prodRes = await db.query(`
    UPDATE public.products
    SET status = 'archived', featured = false
    WHERE name = ANY($1::text[]) OR slug = ANY($2::text[])
  `, [
    delRes.rows.map(r => r.name),
    delRes.rows.map(r => r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
  ]);
  console.log(`Archived ${prodRes.rowCount} corresponding products in public.products.`);

  // Check remaining count in gallery_items
  const countRes = await db.query('SELECT count(*) FROM public.gallery_items');
  console.log(`Remaining clean gallery items in "Our Work": ${countRes.rows[0].count}`);

  await db.end();
}

main().catch(console.error);
