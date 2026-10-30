'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { uploadImage } from '@/features/media/upload';
import { notify } from '@/lib/notify';
import { Button } from '@/components/ui/button';
import { Star, Trash2, UploadCloud, Loader2, ImagePlus, ShieldAlert } from 'lucide-react';

export interface ProductMediaItem {
  id: string;
  media_id: string;
  alt_text: string;
  sort_order: number;
  public_id: string;
  visibility?: string;
  resource_type?: string;
}

interface ProductImageManagerProps {
  productId: string;
  productName?: string;
  canWrite?: boolean;
  canUpload?: boolean;
  onBusyChange?: (busy:boolean)=>void;
}

const MAX_IMAGES = 5;

export function ProductImageManager({
  productId,
  productName = 'Product',
  canWrite = true,
  canUpload = canWrite,
  onBusyChange,
}: ProductImageManagerProps) {
  const [items, setItems] = useState<ProductMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded,setLoaded]=useState(false);
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(()=>{onBusyChange?.(uploading||Boolean(busyActionId));return()=>onBusyChange?.(false);},[uploading,busyActionId,onBusyChange]);
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  const loadMedia = useCallback(async (signal?:AbortSignal) => {
    if (!productId) return;
    try {
      const res = await fetch(`/api/v1/admin/products/${productId}/preview`,{signal});
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'तस्वीरें लोड नहीं हो सकीं');

      const rawMedia = (body.data?.product_media || []) as Array<{
        id: string;
        media_id: string;
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

      const list: ProductMediaItem[] = [];
      for (const m of rawMedia) {
        const asset = Array.isArray(m.media_assets) ? m.media_assets[0] : m.media_assets;
        if (asset && asset.resource_type === 'image' && asset.public_id) {
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
      if(signal?.aborted)return;
      setItems(list);
      setLoaded(true);
      setError('');
    } catch (err) {
      if(signal?.aborted)return;
      setError(err instanceof Error ? err.message : 'तस्वीरें लोड करने में समस्या आई');
    } finally {
      if(!signal?.aborted)setLoading(false);
    }
  }, [productId, productName]);

  useEffect(() => {
    const controller=new AbortController();void Promise.resolve().then(()=>{if(!controller.signal.aborted)return loadMedia(controller.signal);});return()=>controller.abort();
  }, [loadMedia]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!canWrite||!canUpload||uploading||!loaded)return;
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = MAX_IMAGES - items.length;
    if (remainingSlots <= 0) {
      notify(`अधिकतम ${MAX_IMAGES} तस्वीरें ही अपलोड की जा सकती हैं।`, 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      notify(`सिर्फ ${remainingSlots} तस्वीरें चुनी गईं (अधिकतम सीमा: ${MAX_IMAGES})`);
    }

    setUploading(true);
    setError('');

    try {
      let currentSort = items.length ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setProgressText(`तस्वीर ${i + 1}/${filesToUpload.length} अपलोड और सुरक्षित की जा रही है...`);

        // 1. Upload to Cloudinary & register in media_assets
        const asset = await uploadImage(file, 'product');

        // 2. Link to product_media
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
          throw new Error(linkBody.error?.message || 'तस्वीर को प्रोडक्ट से लिंक नहीं किया जा सका');
        }
      }

      notify(`${filesToUpload.length} तस्वीर(ें) सफलतापूर्वक अपलोड हो गईं!`);
      await loadMedia();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'तस्वीर अपलोड विफल रही';
      setError(msg);
      notify(msg, 'error');
    } finally {
      setUploading(false);
      setProgressText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleMakeCover = async (targetItem: ProductMediaItem) => {
    if (!canWrite) return;
    setBusyActionId(targetItem.id);
    setError('');

    try {
      // Re-order so targetItem becomes sort_order = 0, and others shift to 1, 2, ...
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

      notify('मुख्य फोटो (Cover Photo) सफलतापूर्वक सेट की गई!');
      await loadMedia();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'मुख्य फोटो सेट करने में त्रुटि';
      setError(msg);
      notify(msg, 'error');
    } finally {
      setBusyActionId(null);
    }
  };

  const handleDelete = async (targetItem: ProductMediaItem) => {
    if (!canWrite) return;
    if (!window.confirm('क्या आप इस तस्वीर को प्रोडक्ट से हटाना चाहते हैं?')) {
      return;
    }

    setBusyActionId(targetItem.id);
    setError('');

    try {
      const res = await fetch(`/api/v1/admin/product-media/${targetItem.id}`, {
        method: 'DELETE',
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'तस्वीर हटाई नहीं जा सकी');

      notify('तस्वीर सफलतापूर्वक हटा दी गई!');
      await loadMedia();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'तस्वीर हटाने में त्रुटि';
      setError(msg);
      notify(msg, 'error');
    } finally {
      setBusyActionId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 p-5 shadow-sm sm:p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
              <ImagePlus size={16} />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              प्रोडक्ट की तस्वीरें (Product Images)
            </h3>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              {items.length} / {MAX_IMAGES}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            कस्टमर्स को दिखने वाली तस्वीरें। पहली तस्वीर स्वतः <strong>&quot;मुख्य फोटो (Cover Photo)&quot;</strong> होगी।
          </p>
        </div>

        {canWrite && canUpload && items.length < MAX_IMAGES && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple={MAX_IMAGES - items.length > 1}
              className="hidden"
              onChange={(e) => void handleFileSelect(e)}
              disabled={uploading||loading||!loaded}
            />
            <Button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
              size="sm"
            >
              {uploading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  अपलोड हो रहा है...
                </>
              ) : (
                <>
                  <UploadCloud size={15} />
                  + तस्वीर जोड़ें (Upload Photo)
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          <ShieldAlert size={16} className="shrink-0" />
          <span>{error}</span>{!loaded&&<Button type="button" variant="outline" size="sm" onClick={()=>void loadMedia()}>Retry loading images</Button>}
        </div>
      )}

      {uploading && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <Loader2 size={16} className="animate-spin text-amber-600" />
          <span className="font-medium">{progressText || 'कृपया प्रतीक्षा करें, तस्वीर अपलोड हो रही है...'}</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-36 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-xs text-slate-400">
            <Loader2 size={24} className="animate-spin text-amber-500" />
            <span>तस्वीरें लोड हो रही हैं...</span>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div
          onClick={() => {
            if (canWrite && canUpload && !uploading && loaded) fileInputRef.current?.click();
          }}
          className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-300/80 bg-white p-8 text-center transition ${
            canWrite ? 'cursor-pointer hover:border-amber-500 hover:bg-amber-50/30' : ''
          }`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <UploadCloud size={28} />
          </div>
          <h4 className="mt-3 text-sm font-semibold text-slate-800">
            अभी कोई तस्वीर अपलोड नहीं है
          </h4>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            गेट, ग्रिल या फैब्रिकेशन की साफ़ तस्वीरें अपलोड करें। आप अधिकतम 5 तस्वीरें जोड़ सकते हैं।
          </p>
          {canWrite && canUpload && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 border-amber-400 text-amber-800 hover:bg-amber-100"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              तस्वीर चुनें (JPG, PNG, WebP)
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-5">
          {items.map((item, index) => {
            const isCover = index === 0;
            const isBusy = busyActionId === item.id;
            const imgUrl = cloud
              ? `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_400,c_fill,ar_4:3/${item.public_id}`
              : null;

            return (
              <div
                key={item.id}
                className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-xs transition hover:shadow-md ${
                  isCover ? 'border-amber-400 ring-2 ring-amber-300/50' : 'border-slate-200'
                }`}
              >
                {/* Image display */}
                <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  {imgUrl ? (
                    <Image
                      src={imgUrl}
                      alt={item.alt_text}
                      fill
                      sizes="(max-width: 640px) 50vw, 20vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      फोटो
                    </div>
                  )}

                  {/* Cover badge */}
                  {isCover && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-amber-500/95 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                      <Star size={10} className="fill-white" />
                      मुख्य फोटो
                    </span>
                  )}

                  {/* Index badge */}
                  <span className="absolute top-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                    #{index + 1}
                  </span>

                  {isBusy && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                      <Loader2 size={20} className="animate-spin" />
                    </div>
                  )}
                </div>

                {/* Radio button / Primary Selector bar */}
                {canWrite && (
                  <div
                    onClick={() => {
                      if (!isCover) void handleMakeCover(item);
                    }}
                    className={`flex items-center justify-between border-t px-2.5 py-1.5 text-[11px] font-semibold cursor-pointer transition ${
                      isCover
                        ? 'bg-amber-500 text-slate-900 border-amber-400 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-900'
                    }`}
                  >
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="primary_product_image_edit"
                        checked={isCover}
                        onChange={() => {
                          if (!isCover) void handleMakeCover(item);
                        }}
                        className="h-3.5 w-3.5 accent-amber-600 cursor-pointer"
                      />
                      <span>{isCover ? 'मुख्य फोटो (Primary)' : 'मुख्य बनाएं'}</span>
                    </label>

                    <button
                      type="button"
                      title="तस्वीर हटाएं"
                      disabled={isBusy}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(item);
                      }}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Additional upload tile if slots remaining */}
          {canWrite && canUpload && items.length < MAX_IMAGES && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/30 text-amber-700 transition hover:border-amber-400 hover:bg-amber-100/50"
            >
              <UploadCloud size={20} className="text-amber-600" />
              <span className="mt-1 text-[11px] font-semibold">+ नई तस्वीर</span>
              <span className="text-[9px] text-slate-400">({MAX_IMAGES - items.length} जगह शेष)</span>
            </button>
          )}
        </div>
      )}

      {items.length >= MAX_IMAGES && (
        <p className="mt-3 text-[11px] text-slate-500 text-center">
          ✅ अधिकतम 5 तस्वीरें पूरी हो चुकी हैं। नई तस्वीर जोड़ने के लिए किसी एक तस्वीर को हटाएं।
        </p>
      )}
    </div>
  );
}
