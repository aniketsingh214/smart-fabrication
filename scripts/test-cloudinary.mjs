import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

async function testCloudinaryUpload() {
  const testUrl = 'https://i.pinimg.com/originals/24/6c/96/246c962a462468c221756f0f5e91a56f.jpg';
  console.log('Testing upload to Cloudinary from:', testUrl);
  try {
    const res = await cloudinary.uploader.upload(testUrl, {
      folder: 'smart-fabrication/development/pinterest-collection',
      public_id: 'pinterest-test-pin-1',
      overwrite: true,
      tags: ['smartfabrication-pinterest', 'test']
    });
    console.log('Upload successful!');
    console.log('Public ID:', res.public_id);
    console.log('URL:', res.secure_url);
    console.log('Dimensions:', res.width, 'x', res.height);
  } catch (err) {
    console.error('Upload error with original:', err.message);
    const fallbackUrl = 'https://i.pinimg.com/736x/24/6c/96/246c962a462468c221756f0f5e91a56f.jpg';
    console.log('Trying fallback:', fallbackUrl);
    const res2 = await cloudinary.uploader.upload(fallbackUrl, {
      folder: 'smart-fabrication/development/pinterest-collection',
      public_id: 'pinterest-test-pin-1',
      overwrite: true,
      tags: ['smartfabrication-pinterest', 'test']
    });
    console.log('Fallback successful!');
    console.log('Public ID:', res2.public_id);
    console.log('URL:', res2.secure_url);
  }
}

testCloudinaryUpload();
