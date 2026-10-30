'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { notify } from '@/lib/notify';
import { Button } from '@/components/ui/button';
import { uploadMedia } from '@/features/media/upload';
import {
  Star,
  Trash2,
  UploadCloud,
  Loader2,
  CheckCircle2,
  Maximize2,
  AlertCircle,
  Camera,
} from 'lucide-react';

export interface GalleryMediaItem {
  id: string;
  media_id: string;
  alt_text: string;
  sort_order: number;
  public_id: string;
  visibility?: string;
  resource_type?: string;
}

interface ProductPreviewGalleryProps {
  productId: string;
  productName: string;
  initialMedia: Array<{
    id?: string;
    media_id?: string;
    alt_text?: string;
    sort_order?: number;
    media_assets?: {
      id?: string;
      public_id: string;
      resource_type?: string;
      visibility?: string;
    } | Array<{
      id?: string;
      public_id: string;
      resource_type?: string;
      visibility?: string;
    }> | null;
  }>;
  canWrite?: boolean;
}

const MAX_IMAGES = 5;

export function ProductPreviewGallery({
  productId,
  productName,
  initialMedia,
  canWrite = true,
}: ProductPreviewGalleryProps) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize initial media items
  const formatItems = (raw: typeof initialMedia): GalleryMediaItem[] => {
    const list: GalleryMediaItem[] = [];
    for (const m of raw || []) {
      const asset = Array.isArray(m.media_assets) ? m.media_assets[0] : m.media_assets;
      if (asset && asset.resource_type === 'image' && asset.public_id && m.id && m.media_id) {
        list.push({
          id: m.id,
          media_id: m.media_id,
          alt_text: m.alt_text || productName,
          sort_order: m.sort_order ?? 0,
          public_id: asset.public_id,
          visibility: asset.visibility,
          resource_type: asset.resource_type,
        });
      }
    }
    list.sort((a, b) => a.sort_order - b.sort_order);
    return list;
  };

  const [items, setItems] = useState<GalleryMediaItem[]>(() => formatItems(initialMedia));
  const [activeIdx, setActiveIdx] = useState(0);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [zoomOpen, setZoomOpen] = useState(false);

  // Clamp activeIdx
  const currentIdx = Math.min(activeIdx, Math.max(0, items.length - 1));
  const activeItem = items[currentIdx];
  const isPrimary = activeItem ? currentIdx === 0 : false;

  // Make an image primary (sort_order = 0)
  const handleSetPrimary = async (targetItem: GalleryMediaItem) => {
    if (!canWrite) return;
    setBusyActionId(targetItem.id);
    setError('');

    try {
      const reordered = [
        targetItem,
        ...items.filter((item) => item.id !== targetItem.id),
      ];

      for (let idx = 0; idx < reordered.length; idx++) {
        const item = reordered[idx];
        if (item.sort_order !== idx) {
          const res = await fetch(`/api/v1/admin/product-media/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sort_order: idx }),
          });
          if (!res.ok) {
            const body = await res.json();
            throw new Error(body.error?.message || 'क्रम बदलने में त्रुटि');
          }
        }
      }

      const updated = reordered.map((item, idx) => ({ ...item, sort_order: idx }));
      setItems(updated);
      setActiveIdx(0);
      notify('मुख्य फोटो (Primary Image) सफलतापूर्वक सेट की गई!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'मुख्य फोटो सेट करने में त्रुटि';
      setError(msg);
      notify(msg, 'error');
    } finally {
      setBusyActionId(null);
    }
  };

  // Delete an image
  const handleDelete = async (targetItem: GalleryMediaItem) => {
    if (!canWrite) return;
    if (!window.confirm('क्या आप इस तस्वीर को प्रोडक्ट से हटाना चाहते हैं?')) return;

    setBusyActionId(targetItem.id);
    setError('');

    try {
      const res = await fetch(`/api/v1/admin/product-media/${targetItem.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error?.message || 'तस्वीर हटाई नहीं जा सकी');
      }

      const filtered = items
        .filter((item) => item.id !== targetItem.id)
        .map((item, idx) => ({ ...item, sort_order: idx }));
      setItems(filtered);
      setActiveIdx((prev) => Math.max(0, prev - 1));
      notify('तस्वीर सफलतापूर्वक हटा दी गई!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'तस्वीर हटाने में त्रुटि';
      setError(msg);
      notify(msg, 'error');
    } finally {
      setBusyActionId(null);
    }
  };

  // Upload new photo
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - items.length;
    if (remaining <= 0) {
      notify(`अधिकतम ${MAX_IMAGES} तस्वीरें ही अपलोड की जा सकती हैं।`, 'error');
      return;
    }

    const filesToUpload = files.slice(0, remaining);
    setUploading(true);
    setError('');

    try {
      let currentSort = items.length ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;
      const newItems: GalleryMediaItem[] = [...items];

      for (const file of filesToUpload) {
        const asset = await uploadMedia(file, 'product');
        const linkRes = await fetch('/api/v1/admin/product-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: productId,
            media_id: asset.id,
            alt_text: `${productName} photo`,
            sort_order: currentSort++,
          }),
        });

        const linkBody = await linkRes.json();
        if (!linkRes.ok) {
          throw new Error(linkBody.error?.message || 'तस्वीर लिंक नहीं हो सकी');
        }

        // Fetch refreshed product preview to get full public_id
        const refRes = await fetch(`/api/v1/admin/products/${productId}/preview`);
        const refBody = await refRes.json();
        if (refRes.ok && refBody.data?.product_media) {
          setItems(formatItems(refBody.data.product_media));
        }
      }

      notify(`${filesToUpload.length} तस्वीर(ें) सफलतापूर्वक अपलोड हो गईं!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'तस्वीर अपलोड नहीं हो सकी';
      setError(msg);
      notify(msg, 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Primary Selector Header & Instructions Banner */}
      <div className="rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50 via-white to-amber-50/60 p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
              <Star size={16} className="fill-white" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                प्रोडक्ट तस्वीरें व मुख्य फोटो (Primary Cover)
              </h3>
              <p className="text-xs text-slate-600">
                नीचे किसी भी तस्वीर पर <strong>&quot;मुख्य फोटो बनाएं&quot;</strong> चुनकर उसे वेबसाइट का कवर फोटो बना सकते हैं।
              </p>
            </div>
          </div>

          {canWrite && items.length < MAX_IMAGES && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple={MAX_IMAGES - items.length > 1}
                className="hidden"
                onChange={(e) => void handleUpload(e)}
              />
              <Button
                type="button"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 bg-amber-600 text-white hover:bg-amber-700 shadow-xs"
              >
                {uploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    अपलोड हो रहा है...
                  </>
                ) : (
                  <>
                    <UploadCloud size={14} />
                    + नई तस्वीर जोड़ें ({items.length}/{MAX_IMAGES})
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Main Image Showcase */}
      {items.length === 0 ? (
        <div
          onClick={() => {
            if (canWrite && !uploading) fileInputRef.current?.click();
          }}
          className={`flex aspect-[4/3] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/30 p-8 text-center transition ${
            canWrite ? 'cursor-pointer hover:border-amber-500 hover:bg-amber-50/60' : ''
          }`}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-xs">
            <Camera size={32} />
          </div>
          <h4 className="mt-4 text-base font-bold text-slate-800">
            इस प्रोडक्ट की कोई तस्वीर नहीं है
          </h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            वेबसाइट और कैटलॉग पर दिखने के लिए कम से कम एक तस्वीर अवश्य अपलोड करें। अधिकतम 5 तस्वीरें रखी जा सकती हैं।
          </p>
          {canWrite && (
            <Button
              type="button"
              size="sm"
              className="mt-4 gap-2 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <UploadCloud size={15} />
              तस्वीर चुनें और अपलोड करें
            </Button>
          )}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200/90 bg-slate-900 shadow-md">
          {/* Main Photo Display */}
          <div className="relative aspect-[16/10] w-full bg-slate-950 flex items-center justify-center">
            {cloud && activeItem ? (
              <Image
                src={`https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_1400/${activeItem.public_id}`}
                alt={activeItem.alt_text}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-contain"
                priority
                unoptimized
              />
            ) : (
              <div className="text-sm text-slate-400">तस्वीर अनुपलब्ध है</div>
            )}

            {/* Top Bar Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
              {isPrimary ? (
                <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1 text-xs font-bold text-white shadow-md">
                  <Star size={13} className="fill-white" />
                  ⭐ मुख्य फोटो (Primary Cover)
                </span>
              ) : (
                <span className="rounded-full bg-black/60 backdrop-blur-sm px-3 py-1 text-xs font-medium text-slate-200">
                  गैलरी तस्वीर #{currentIdx + 1}
                </span>
              )}

              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  type="button"
                  title="बड़ी स्क्रीन में देखें"
                  onClick={() => setZoomOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 transition"
                >
                  <Maximize2 size={15} />
                </button>
              </div>
            </div>

            {/* Bottom Quick-Action Toolbar */}
            {canWrite && activeItem && (
              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/75 px-4 py-2.5 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  {isPrimary ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                      <CheckCircle2 size={15} />
                      यह तस्वीर वेबसाइट पर मुख्य फोटो (Cover) के रूप में दिखाई जा रही है
                    </span>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      disabled={busyActionId === activeItem.id}
                      onClick={() => void handleSetPrimary(activeItem)}
                      className="gap-1.5 bg-amber-500 text-slate-900 font-bold hover:bg-amber-400 shadow-sm"
                    >
                      {busyActionId === activeItem.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Star size={13} className="fill-slate-900" />
                      )}
                      ⭐ इसे मुख्य फोटो बनाएं (Set as Primary)
                    </Button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={busyActionId === activeItem.id}
                  onClick={() => void handleDelete(activeItem)}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-300 hover:bg-red-950/60 hover:text-red-200 transition"
                >
                  <Trash2 size={13} />
                  तस्वीर हटाएं
                </button>
              </div>
            )}
          </div>

          {/* Thumbnails Strip with Direct Radio Selector */}
          <div className="border-t border-slate-800 bg-slate-900/95 p-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
              <span className="font-medium">
                तस्वीरें चुनें ({items.length} / {MAX_IMAGES}) — मुख्य फोटो चुनने के लिए नीचे रेडियो बटन पर क्लिक करें:
              </span>
              <span className="text-[11px] text-slate-400">
                वर्तमान में: #{currentIdx + 1}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              {items.map((item, index) => {
                const itemIsPrimary = index === 0;
                const isSelected = index === currentIdx;
                const imgThumb = cloud
                  ? `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_240,c_fill,ar_4:3/${item.public_id}`
                  : null;

                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveIdx(index)}
                    className={`group relative flex flex-col overflow-hidden rounded-xl border transition cursor-pointer ${
                      itemIsPrimary
                        ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/60'
                        : isSelected
                        ? 'border-white bg-slate-800 ring-2 ring-white/50'
                        : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
                      {imgThumb ? (
                        <Image
                          src={imgThumb}
                          alt={item.alt_text}
                          fill
                          sizes="150px"
                          className="object-cover transition duration-200 group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-slate-500">
                          फोटो
                        </div>
                      )}

                      {/* Primary Golden Star Icon */}
                      {itemIsPrimary && (
                        <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                          <Star size={9} className="fill-white" />
                          मुख्य
                        </span>
                      )}

                      <span className="absolute top-1 right-1 rounded bg-black/70 px-1 py-0.2 text-[9px] font-medium text-white">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Radio Button / Primary Selector underneath each thumbnail */}
                    {canWrite && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!itemIsPrimary) void handleSetPrimary(item);
                        }}
                        className={`flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold transition ${
                          itemIsPrimary
                            ? 'bg-amber-500 text-slate-900 cursor-default'
                            : 'bg-slate-800 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="primary_product_preview"
                          checked={itemIsPrimary}
                          onChange={() => {
                            if (!itemIsPrimary) void handleSetPrimary(item);
                          }}
                          className="h-3.5 w-3.5 accent-amber-500 cursor-pointer"
                        />
                        <span>{itemIsPrimary ? 'मुख्य (Primary)' : 'मुख्य बनाएं'}</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Upload Slot Tile */}
              {canWrite && items.length < MAX_IMAGES && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-800/40 text-slate-300 transition hover:border-amber-400 hover:bg-slate-800 hover:text-amber-300"
                >
                  <UploadCloud size={18} className="text-amber-400" />
                  <span className="mt-1 text-[11px] font-medium">+ तस्वीर जोड़ें</span>
                  <span className="text-[9px] text-slate-400">({MAX_IMAGES - items.length} बाकी)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Zoom Modal */}
      {zoomOpen && activeItem && cloud && (
        <div
          onClick={() => setZoomOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl bg-black"
          >
            <div className="relative h-[80vh] w-[90vw] max-w-5xl">
              <Image
                src={`https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_1800/${activeItem.public_id}`}
                alt={activeItem.alt_text}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900 px-5 py-3 text-sm text-white">
              <span>{activeItem.alt_text} {isPrimary ? '⭐ (मुख्य फोटो)' : ''}</span>
              <button
                type="button"
                onClick={() => setZoomOpen(false)}
                className="rounded-lg bg-slate-800 px-3 py-1 text-xs hover:bg-slate-700"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
