'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notify';
import {
  Wrench,
  CheckCircle2,
  Clock,
  Eye,
  FileEdit,
  Save,
  Image as ImageIcon,
  ShieldCheck,
  X,
} from 'lucide-react';
import { MediaUploader } from '@/features/media/media-uploader';

interface InstallationRecord {
  id: string;
  name: string;
  order_id?: string;
  delivery_id?: string;
  status: 'pending' | 'completed';
  installed_by?: string | null;
  customer_confirmed: boolean;
  customer_signature?: string | null;
  remarks?: string | null;
  completed_at?: string | null;
  checklist?: Record<string, boolean>;
  photos?: string[];
  created_at: string;
}

interface OrderInstallationProps {
  order: Record<string, unknown>;
  permissions: string[];
  onUpdated?: () => void;
}

export function OrderInstallationWorkspace({
  order,
  permissions,
  onUpdated,
}: OrderInstallationProps) {
  const orderId = String(order.id);
  const [record, setRecord] = useState<InstallationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [status, setStatus] = useState<'pending' | 'completed'>('completed');
  const [installedBy, setInstalledBy] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const [customerSignature, setCustomerSignature] = useState('');
  const [remarks, setRemarks] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [showPhotoUploader, setShowPhotoUploader] = useState(false);

  const canWrite = permissions.includes('delivery.write') || permissions.includes('orders.write');

  const loadInstallation = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/installation`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Failed to load installation');

      if (body.data) {
        const item: InstallationRecord = body.data;
        setRecord(item);
        setStatus(item.status || 'pending');
        setInstalledBy(item.installed_by || '');
        setCustomerSignature(item.customer_signature || '');
        setRemarks(item.remarks || '');
        if (item.completed_at) {
          try {
            const d = new Date(item.completed_at);
            setCompletedAt(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
          } catch {
            setCompletedAt(new Date().toISOString().slice(0, 16));
          }
        } else {
          setCompletedAt(new Date().toISOString().slice(0, 16));
        }
      } else {
        setCompletedAt(new Date().toISOString().slice(0, 16));
      }
    } catch {
      // silent fallback
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadInstallation();
  }, [loadInstallation]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite || submitting) return;

    if (status === 'completed' && !completedAt) {
      notify('कृपया इंस्टॉलेशन का दिनांक और समय दर्ज करें (Installation date/time required)', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const photosArray = record?.photos ? [...record.photos] : [];
      if (photoUrl.trim() && !photosArray.includes(photoUrl.trim())) {
        photosArray.push(photoUrl.trim());
      }

      const res = await fetch(`/api/v1/orders/${orderId}/installation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          installed_by: installedBy.trim() || null,
          customer_signature: customerSignature.trim() || null,
          remarks: remarks.trim() || null,
          completed_at: completedAt ? new Date(completedAt).toISOString() : new Date().toISOString(),
          customer_confirmed: status === 'completed',
          photos: photosArray,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Failed to save installation sign-off');

      notify('इंस्टॉलेशन साइन-ऑफ सफलतापूर्वक सुरक्षित हुआ (Installation sign-off saved)');
      setEditing(false);
      setPhotoUrl('');
      setShowPhotoUploader(false);
      await loadInstallation();
      if (onUpdated) onUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save installation sign-off';
      notify(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isCompleted = record?.status === 'completed' && Boolean(record?.customer_confirmed);

  return (
    <div className="mt-5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/40 via-white to-sky-50/30 p-5 shadow-sm">
      {/* Header & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-700 text-white shadow-xs">
            <Wrench size={16} />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Installation &amp; Handover (इंस्टॉलेशन एवं अंतिम हैंडओवर)
            </h3>
            <p className="text-xs text-slate-500">
              Site fitting, customer confirmation &amp; final handover for Order #{String(order.record_code || order.name)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
              <CheckCircle2 size={14} className="text-emerald-600" />
              INSTALLATION SIGN-OFF COMPLETED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100/80 px-3 py-1 text-xs font-bold text-amber-900 shadow-2xs">
              <Clock size={14} className="text-amber-700" />
              INSTALLATION SIGN-OFF PENDING
            </span>
          )}

          {/* View Installation Details Button */}
          {Boolean(record) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 border-blue-200 text-blue-900 hover:bg-blue-50"
              onClick={() => setViewDetailsOpen(!viewDetailsOpen)}
            >
              <Eye size={14} />
              <span>View Installation Details</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Panel Content */}
      {editing ? (
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900">
            <p className="font-semibold">
              Fill in the site installation details. This sign-off is mandatory before marking the order as COMPLETED.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Installation Completion Status <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'pending' | 'completed')}
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden"
                required
              >
                <option value="completed">Completed &amp; Handed Over (कार्य पूर्ण एवं हैंडओवर)</option>
                <option value="pending">Pending / In Progress (लंबित / कार्य प्रगति पर)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Installation Date &amp; Time (दिनांक व समय) <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={completedAt}
                onChange={(e) => setCompletedAt(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Installed By (कारीगर / टीम का नाम)
              </label>
              <input
                type="text"
                placeholder="e.g. Mohd. Farooq &amp; Fitting Team"
                value={installedBy}
                onChange={(e) => setInstalledBy(e.target.value)}
                maxLength={200}
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Customer Confirmation / Signature (ग्राहक सहमति / हस्ताक्षर)
              </label>
              <input
                type="text"
                placeholder="e.g. Satisfied with fitting - Rajesh Sharma"
                value={customerSignature}
                onChange={(e) => setCustomerSignature(e.target.value)}
                maxLength={200}
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">
                Installation Remarks (साइट टिप्पणी)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Gate hinges anchored with heavy-duty bolts, smooth swing alignment verified, site cleaned."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                maxLength={2000}
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-slate-500" />
                    Installation Completion Photos (वैकल्पिक फोटो)
                  </label>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Optional: Upload photo of fitted gate / railing on customer site.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowPhotoUploader(!showPhotoUploader)}
                >
                  {showPhotoUploader ? 'Hide Uploader' : 'Upload Photos'}
                </Button>
              </div>

              {showPhotoUploader && (
                <div className="mt-3">
                  <MediaUploader contexts={['delivery_proof']} />
                </div>
              )}

              <div className="mt-2.5">
                <input
                  type="text"
                  placeholder="Paste verified photo asset ID or URL (optional)"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold shadow-xs"
            >
              <Save size={14} className="mr-1.5" />
              {submitting
                ? 'Saving...'
                : record
                ? 'Update Installation Sign-off'
                : 'Save Installation Sign-off'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Summary Display Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Installation Status
              </span>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                {isCompleted ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 size={15} /> Completed &amp; Handed Over (पूर्ण)
                  </span>
                ) : (
                  <span className="text-amber-700 flex items-center gap-1">
                    <Clock size={15} /> Pending Installation (लंबित)
                  </span>
                )}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Installation Date &amp; Time
              </span>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {record?.completed_at
                  ? new Date(record.completed_at).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'Not yet recorded'}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Installed By (कारीगर / टीम)
              </span>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {record?.installed_by || 'Not assigned'}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Customer Confirmation / Signature
              </span>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {record?.customer_signature || (isCompleted ? 'Confirmed by customer' : 'Pending')}
              </p>
            </div>
          </div>

          {/* Remarks */}
          {Boolean(record?.remarks) && (
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Installation Remarks &amp; Site Notes
              </span>
              <p className="mt-1 text-xs text-slate-700 whitespace-pre-line">{record?.remarks}</p>
            </div>
          )}

          {/* Action Buttons: Save Installation Sign-off / Update Installation Sign-off */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500">
              {isCompleted
                ? 'Installation sign-off is verified and recorded for this order.'
                : 'Complete sign-off once fabrication is installed on site to unlock order completion.'}
            </span>

            {canWrite && (
              <div className="flex items-center gap-2">
                {record ? (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-blue-700 hover:bg-blue-800 text-white font-semibold gap-1.5 shadow-xs"
                    onClick={() => setEditing(true)}
                  >
                    <FileEdit size={14} />
                    <span>Update Installation Sign-off</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-blue-700 hover:bg-blue-800 text-white font-semibold gap-1.5 shadow-xs"
                    onClick={() => setEditing(true)}
                  >
                    <Save size={14} />
                    <span>Save Installation Sign-off</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Installation Details Modal */}
      {viewDetailsOpen && record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-700" />
                <h4 className="text-base font-bold text-slate-900">
                  Installation Sign-off Record Details
                </h4>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600"
                onClick={() => setViewDetailsOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">System ID</span>
                <p className="font-mono text-xs text-slate-700 select-all">{record.id}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Order ID</span>
                <p className="font-mono text-xs text-slate-700 select-all">{orderId}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Status</span>
                  <p className="mt-0.5 text-xs font-bold text-slate-800 uppercase">{record.status}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Customer Confirmed</span>
                  <p className="mt-0.5 text-xs font-bold text-slate-800">
                    {record.customer_confirmed ? 'Yes ✓' : 'No'}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Installed By</span>
                <p className="text-sm font-semibold text-slate-800">{record.installed_by || 'None specified'}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Confirmation / Signature</span>
                <p className="text-sm font-semibold text-slate-800">{record.customer_signature || 'Confirmed on site'}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Completed At</span>
                <p className="text-sm text-slate-800">
                  {record.completed_at ? new Date(record.completed_at).toLocaleString('en-IN') : 'None'}
                </p>
              </div>

              {Boolean(record.remarks) && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Remarks</span>
                  <p className="mt-1 text-xs text-slate-700 whitespace-pre-line rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                    {record.remarks}
                  </p>
                </div>
              )}

              {Boolean(record.photos && record.photos.length > 0) && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Attached Photo IDs / URLs</span>
                  <ul className="mt-1 list-disc pl-5 text-xs font-mono text-slate-600">
                    {record.photos!.map((p, i) => (
                      <li key={i} className="break-all">{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewDetailsOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
