type Asset = { public_id: string; resource_type: string; visibility?: string };
type Media = { alt_text: string; media_assets: Asset | Asset[] | null };
export function ProductVideos({ media }: { media: Media[] }) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) return null;
  const videos = media.map(item => ({ ...item, asset: Array.isArray(item.media_assets) ? item.media_assets[0] : item.media_assets })).filter(item => item.asset?.resource_type === 'video' && item.asset.visibility === 'public');
  if (!videos.length) return null;
  return <section aria-label="Product videos" className="mt-5 space-y-4">{videos.map(item => <div key={item.asset!.public_id}><video className="w-full rounded-xl bg-slate-900" controls playsInline preload="none" aria-label={item.alt_text || 'Product demonstration'} src={`https://res.cloudinary.com/${cloud}/video/upload/q_auto/${item.asset!.public_id}`}><p>Your browser cannot play this product video.</p></video>{item.alt_text && <p className="mt-2 text-sm text-slate-500">{item.alt_text}</p>}</div>)}</section>;
}
