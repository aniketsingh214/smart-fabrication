'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notify';
import { CheckCircle2, Truck, FileText, Clock, UserCheck, Image as ImageIcon } from 'lucide-react';
import { MediaUploader } from '@/features/media/media-uploader';

interface DeliverySignoffProps {
  delivery: Record<string, unknown>;
  canWrite: boolean;
  onSaved?: () => void;
}

export function DeliverySignoffCard({ delivery, canWrite, onSaved }: DeliverySignoffProps) {
  const deliveryId = String(delivery.id);
  const orderId = String(delivery.order_id || '');
  const isDelivered = delivery.status === 'delivered' && Boolean(delivery.confirmed_at);

  const [editing, setEditing] = useState(!isDelivered);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string>(String(delivery.status || 'dispatched'));
  const [deliveredBy, setDeliveredBy] = useState<string>(
    String(delivery.delivered_by || delivery.crew || '')
  );
  const [customerSignature, setCustomerSignature] = useState<string>(
    String(delivery.customer_signature || '')
  );
  const [remarks, setRemarks] = useState<string>(String(delivery.remarks || ''));
  const [confirmedAt, setConfirmedAt] = useState<string>(() => {
    if (delivery.confirmed_at) {
      try {
        const d = new Date(String(delivery.confirmed_at));
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      } catch {
        // fallback
      }
    }
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [proofMediaId, setProofMediaId] = useState<string>(
    delivery.proof_media_id ? String(delivery.proof_media_id) : ''
  );
  const [showMediaUploader, setShowMediaUploader] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite || submitting) return;

    if (status === 'delivered' && !confirmedAt) {
      notify('कृपया डिलीवरी दिनांक और समय चुनें (Delivery date & time required)', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        status: status === 'scheduled' ? 'delivered' : status,
        confirmed_at: confirmedAt ? new Date(confirmedAt).toISOString() : new Date().toISOString(),
        delivered_by: deliveredBy.trim(),
        customer_signature: customerSignature.trim(),
        remarks: remarks.trim(),
        proof_media_id: proofMediaId.trim() || null,
      };

      const res = await fetch(`/api/v1/admin/deliveries/${deliveryId}/transitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to save delivery sign-off');
      }

      notify('डिलीवरी साइन-ऑफ सफलतापूर्वक सुरक्षित हुआ (Delivery sign-off saved)');
      setEditing(false);
      if (onSaved) onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delivery sign-off failed';
      notify(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-amber-300/80 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-700 text-white shadow-xs">
            <Truck size={16} />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Delivery Sign-off (डिलीवरी साइन-ऑफ)
            </h3>
            <p className="text-xs text-slate-500">
              Associated Order ID:{' '}
              <span className="font-mono font-semibold text-slate-700 select-all">{orderId || delivery.order_id ? String(orderId || delivery.order_id) : 'Linked to Order'}</span>
            </p>
          </div>
        </div>

        <div>
          {isDelivered && !editing ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
              <CheckCircle2 size={14} className="text-emerald-600" />
              DELIVERY SIGN-OFF COMPLETED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100/80 px-3 py-1 text-xs font-bold text-amber-900 shadow-2xs">
              <Clock size={14} className="text-amber-700" />
              SIGN-OFF PENDING
            </span>
          )}
        </div>
      </div>

      {isDelivered && !editing ? (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Delivery Status
              </span>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                <CheckCircle2 size={15} /> Delivered (सामग्री पहुँच चुकी है)
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Delivery Date &amp; Time
              </span>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {delivery.confirmed_at
                  ? new Date(String(delivery.confirmed_at)).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'Confirmed'}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Delivered By (डिलीवर करने वाला)
              </span>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {String(delivery.delivered_by || delivery.crew || 'Workshop Crew')}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Customer Confirmation / Signature
              </span>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {String(delivery.customer_signature || 'Confirmed by customer on site')}
              </p>
            </div>
          </div>

          {Boolean(delivery.remarks) && (
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Delivery Remarks / Notes
              </span>
              <p className="mt-1 text-xs text-slate-700 whitespace-pre-line">
                {String(delivery.remarks)}
              </p>
            </div>
          )}

          {Boolean(delivery.proof_media_id) && (
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Delivery Proof Media ID
              </span>
              <p className="mt-1 font-mono text-xs text-slate-600">
                {String(delivery.proof_media_id)}
              </p>
            </div>
          )}

          {canWrite && (
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-900 hover:bg-amber-100"
                onClick={() => setEditing(true)}
              >
                Update Delivery Sign-off (संशोधित करें)
              </Button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Delivery Completion Status <span className="text-red-500">*</span>
              </label>
              <select
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="delivered">Delivered (पूर्ण - Delivered &amp; Signed-off)</option>
                <option value="dispatched">Dispatched (रास्ते में / On the way)</option>
                <option value="scheduled">Scheduled (नियोजित / Planned)</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                ऑर्डर पूरा करने के लिए Delivered स्थिति आवश्यक है।
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Delivery Date &amp; Time (डिलीवरी समय) <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                value={confirmedAt}
                onChange={(e) => setConfirmedAt(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Delivered By (स्टाफ / ड्राइवर का नाम)
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Singh / Driver"
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                value={deliveredBy}
                onChange={(e) => setDeliveredBy(e.target.value)}
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Customer Confirmation / Signature (ग्राहक पुष्टि / हस्ताक्षर)
              </label>
              <input
                type="text"
                placeholder="e.g. Received in good condition - Amit Verma"
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                value={customerSignature}
                onChange={(e) => setCustomerSignature(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">
                Delivery Remarks (डिलीवरी टिप्पणी)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Main gate & boundary railing delivered safely at site."
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                maxLength={2000}
              />
            </div>

            <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-slate-500" />
                    Delivery Proof / Photo (वैकल्पिक फोटो)
                  </label>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Optional: Upload photo proof of gate handed over at the site.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowMediaUploader(!showMediaUploader)}
                >
                  {showMediaUploader ? 'Hide Uploader' : 'Upload Delivery Proof'}
                </Button>
              </div>

              {showMediaUploader && (
                <div className="mt-3">
                  <MediaUploader contexts={['delivery_proof']} />
                </div>
              )}

              <div className="mt-2.5">
                <input
                  type="text"
                  placeholder="Paste verified proof media ID (optional)"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs"
                  value={proofMediaId}
                  onChange={(e) => setProofMediaId(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-3">
            {isDelivered && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-amber-700 hover:bg-amber-800 text-white font-semibold shadow-xs"
            >
              {submitting ? 'Saving...' : 'Save Delivery Sign-off (साइन-ऑफ सुरक्षित करें)'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
