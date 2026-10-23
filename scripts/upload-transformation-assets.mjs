import { v2 as cloudinary } from 'cloudinary';
import { databaseClient } from './db-client.mjs';
import crypto from 'node:crypto';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function main() {
  const localFile = 'C:\\Users\\mukul\\.gemini\\antigravity-ide\\brain\\92c5a1a5-61f4-42ac-b6af-6219f1792376\\before_gate_renovation_1792748089676.jpg';
  const publicId = 'smart-fabrication/development/transformation/old-rusted-gate-before';

  console.log('Uploading before-transformation photo to Cloudinary...');
  const res = await cloudinary.uploader.upload(localFile, {
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
    tags: ['transformation', 'before-upgrade', 'gate']
  });

  console.log('Upload success:', res.public_id, res.secure_url, `${res.width}x${res.height}`);

  const client = databaseClient();
  await client.connect();

  const assetId = crypto.randomUUID();
  const id = crypto.randomUUID();

  await client.query(`
    INSERT INTO media_assets (id, asset_id, public_id, resource_type, format, bytes, width, height, visibility, context)
    VALUES ($1, $2, $3, 'image', $4, $5, $6, $7, 'public', $8)
    ON CONFLICT (public_id) DO UPDATE
    SET width = EXCLUDED.width, height = EXCLUDED.height, bytes = EXCLUDED.bytes
  `, [id, res.asset_id || assetId, publicId, res.format, res.bytes, res.width, res.height, { title: 'Old Weathered Iron Gate (Before)' }]);

  console.log('Registered in media_assets database successfully!');
  await client.end();
}

main().catch(console.error);
