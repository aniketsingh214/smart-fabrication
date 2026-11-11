'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notify';
import {
  Download,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Banknote,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Calendar,
  UserCheck,
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  amount_minor: number;
  mode: string;
  reference: string;
  installment_number?: number | null;
  due_date?: string | null;
  received_by?: string | null;
  notes?: string | null;
  record_code?: string | null;
  created_at: string;
}

interface PaymentSummary {
  orderId: string;
  orderName: string;
  status: string;
  version: number;
  totalMinor: number;
  totalPaidMinor: number;
  balanceDueMinor: number;
  paymentStatus?: string;
  isPaidAllDone?: boolean;
  paymentStage?: string;
  isDispatchEligible?: boolean;
  payments: PaymentRecord[];
}

export function OrderPaymentWorkspace({
  order,
  permissions,
  onPaymentRecorded,
}: {
  order: Record<string, unknown>;
  permissions: string[];
  onPaymentRecorded?: () => void;
}) {
  const orderId = String(order.id);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceFresh, setBalanceFresh] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states for recording installments
  const [amountRupees, setAmountRupees] = useState('');
  const [mode, setMode] = useState<'cash' | 'upi' | 'bank' | 'cheque'>('cash');
  const [reference, setReference] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const paymentAttempt = useRef<{ signature: string; key: string } | null>(null);
  const paymentInFlight = useRef(false);

  const canWriteFinance =
    permissions.includes('finance.write') && permissions.includes('orders.write');

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/advance-payment`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Failed to load payments');
      setSummary(body.data);
      setError('');
      setBalanceFresh(true);

      // Pre-fill amount
      if (body.data) {
        const total = body.data.totalMinor / 100;
        const paid = body.data.totalPaidMinor / 100;
        const balance = body.data.balanceDueMinor / 100;
        if (paid === 0 && total > 0) {
          setAmountRupees(String(Math.round(total * 0.3)));
        } else if (balance > 0) {
          setAmountRupees(balance.toFixed(2));
        }
      }
    } catch (e) {
      setBalanceFresh(false);
      setError(e instanceof Error ? e.message : 'Payments could not be loaded. Refresh to retry.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void Promise.resolve().then(loadSummary);
  }, [loadSummary]);

  const handlePresetPercent = (percent: number) => {
    if (!summary) return;
    const total = summary.totalMinor / 100;
    const calc =
      percent === 100
        ? summary.balanceDueMinor / 100
        : Math.min(summary.balanceDueMinor / 100, Math.round(total * percent) / 100);
    setAmountRupees(String(calc));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentInFlight.current || refreshing || !summary) return;
    setError('');

    const amtNum = parseFloat(amountRupees);
    if (!amtNum || amtNum <= 0) {
      setError('कृपया मान्य किस्त राशि दर्ज करें (Enter a valid positive installment amount)');
      return;
    }
    if (!Number.isFinite(amtNum) || Math.round(amtNum * 100) > summary.balanceDueMinor) {
      setError('Amount cannot exceed the remaining balance.');
      return;
    }
    if (!reference.trim()) {
      setError('भुगतान संदर्भ / UTR नंबर दर्ज करें (Reference / Transaction ID required)');
      return;
    }

    paymentInFlight.current = true;
    const nextInstallmentNum = (summary.payments?.length || 0) + 1;
    const signature = JSON.stringify([
      Math.round(amtNum * 100),
      mode,
      reference.trim(),
      receivedBy.trim(),
      nextInstallmentNum,
    ]);

    if (paymentAttempt.current?.signature !== signature) {
      paymentAttempt.current = { signature, key: crypto.randomUUID() };
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/advance-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': paymentAttempt.current!.key,
        },
        body: JSON.stringify({
          amount_minor: Math.round(amtNum * 100),
          mode,
          reference: reference.trim(),
          installment_number: nextInstallmentNum,
          due_date: dueDate || null,
          received_by: receivedBy.trim() || null,
          notes: paymentNotes.trim() || null,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Payment recording failed');

      notify(`Installment #${nextInstallmentNum} recorded successfully.`);
      setSuccessMsg(`Installment #${nextInstallmentNum} saved. The outstanding balance has been updated.`);
      paymentAttempt.current = null;
      setReference('');
      setPaymentNotes('');
      setShowForm(false);
      setSubmitting(false);
      setRefreshing(true);
      await loadSummary();
      if (onPaymentRecorded) {
        onPaymentRecorded();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment recording failed';
      setError(msg);
      notify(msg, 'error');
    } finally {
      paymentInFlight.current = false;
      setSubmitting(false);
      setRefreshing(false);
    }
  };

  const totalRupees = summary ? summary.totalMinor / 100 : Number(order.total_minor || 0) / 100;
  const paidRupees = summary ? summary.totalPaidMinor / 100 : 0;
  // Automatically calculate: Remaining Balance = Total Order Amount - Total Payments Received
  const balanceRupees = Math.max(0, totalRupees - paidRupees);
  const percentPaid = totalRupees > 0 ? Math.min(100, Math.round((paidRupees / totalRupees) * 100)) : 0;
  const hasPayments = summary && summary.payments && summary.payments.length > 0;

  // Payments ordered chronologically for installment # display
  const chronologicalPayments = summary?.payments
    ? [...summary.payments].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    : [];

  const advancePaymentRecord = chronologicalPayments[0];
  const advanceAmountRupees = advancePaymentRecord ? advancePaymentRecord.amount_minor / 100 : 0;

  return (
    <div className="mt-6 rounded-xl border border-amber-300/80 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 p-5 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-700 text-white shadow-xs">
              <CreditCard size={16} />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Installment &amp; Payment Management (किस्त एवं भुगतान प्रबंधन)
            </h3>
            {balanceRupees === 0 ? (
              <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-800 flex items-center gap-1 shadow-2xs">
                <CheckCircle2 size={13} className="text-emerald-600" /> PAID – ALL DONE (100%)
              </span>
            ) : paidRupees > 0 ? (
              <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-800 flex items-center gap-1 shadow-2xs">
                <AlertCircle size={13} className="text-amber-600" /> PARTIALLY PAID (किस्त चालू)
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 text-xs font-bold text-slate-700 shadow-2xs">
                PENDING (Advance Pending)
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Manual Payment System: Cash / Direct UPI Scan / Bank Transfer / Cheque (Multiple Installments Supported)
          </p>
        </div>

        {/* Download Full Receipt CTA Button */}
        {hasPayments && (
          <Button asChild className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs">
            <a
              href={`/api/v1/orders/${orderId}/receipt`}
              target="_blank"
              rel="noopener noreferrer"
              title="Download official PDF receipt"
            >
              <Download size={15} />
              <span>रसीद डाउनलोड करें (PDF Receipt)</span>
            </a>
          </Button>
        )}
      </div>

      {/* Financial Summary Cards: Total, Advance, Total Paid, Remaining Balance */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Order Amount */}
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Order Amount (कुल रकम)
          </span>
          <p className="mt-1 text-lg font-bold text-slate-900">
            ₹{totalRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Advance Payment */}
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3.5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-800">
            Advance Payment (अग्रिम भुगतान)
          </span>
          <p className="mt-1 text-lg font-bold text-blue-900">
            ₹{advanceAmountRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-blue-700">
            {advancePaymentRecord ? 'Installment #1 (Advance Received)' : 'Not yet paid'}
          </span>
        </div>

        {/* Total Payments Received */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Total Received (कुल प्राप्त)
            </span>
            <span className="rounded-full bg-emerald-200/70 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
              {percentPaid}%
            </span>
          </div>
          <p className="mt-1 text-lg font-bold text-emerald-700">
            ₹{paidRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-700">
            {chronologicalPayments.length} installment{chronologicalPayments.length === 1 ? '' : 's'} recorded
          </span>
        </div>

        {/* Remaining Balance */}
        <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-3.5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
            Remaining Balance (शेष बाकी)
          </span>
          <p
            className={`mt-1 text-lg font-bold ${
              balanceRupees > 0 ? 'text-amber-900' : 'text-emerald-700'
            }`}
          >
            ₹{balanceRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-amber-800 font-medium">
            {balanceRupees === 0 ? '100% Cleared (₹0 Remaining)' : 'Must be ₹0 before dispatch'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-emerald-600 transition-all duration-500 ease-out"
            style={{ width: `${percentPaid}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-slate-500">
          <span>
            {paidRupees > 0
              ? `${percentPaid}% paid across ${chronologicalPayments.length} installment(s)`
              : 'Advance pending — record first installment below'}
          </span>
          <span>
            {balanceRupees === 0 ? 'Fully Paid ✓' : `Remaining Balance: ₹${balanceRupees.toLocaleString('en-IN')}`}
          </span>
        </div>
      </div>

      {refreshing && <p role="status" className="mt-3 text-sm text-slate-500">Payment saved. Updating installments...</p>}
      {loading && <p role="status" className="mt-3 text-sm text-slate-500">Loading installment balance...</p>}

      {/* Record Next Installment CTA / Form */}
      {summary && !refreshing && balanceFresh && canWriteFinance && summary.status !== 'CANCELLED' && balanceRupees > 0 && (
        <div className="mt-4">
          {!showForm ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(true)}
              className="w-full gap-2 border-amber-300 bg-white hover:bg-amber-50 font-semibold text-amber-900 shadow-xs"
            >
              <Banknote size={16} />
              <span>
                Record Installment #{chronologicalPayments.length + 1} ({chronologicalPayments.length === 0 ? 'Advance Payment' : 'Next Installment'})
              </span>
              <ChevronDown size={15} />
            </Button>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-lg border border-amber-300 bg-white p-4 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Banknote size={16} className="text-amber-700" />
                  Record Installment #{chronologicalPayments.length + 1}
                  {chronologicalPayments.length === 0 ? ' (Advance Payment)' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  छिपाएं <ChevronUp size={13} />
                </button>
              </div>

              {/* Installment Amount with Quick Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    किस्त की राशि (Installment Amount in ₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">त्वरित सुझाव:</span>
                    {chronologicalPayments.length === 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handlePresetPercent(25)}
                          className="rounded bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-700"
                        >
                          25%
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePresetPercent(30)}
                          className="rounded bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 text-[11px] font-medium text-amber-900"
                        >
                          30% (Advance)
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePresetPercent(50)}
                          className="rounded bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-700"
                        >
                          50%
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handlePresetPercent(100)}
                      className="rounded bg-emerald-100 hover:bg-emerald-200 px-1.5 py-0.5 text-[11px] font-bold text-emerald-900"
                    >
                      Full Balance (₹{balanceRupees.toLocaleString('en-IN')})
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={balanceRupees}
                    required
                    value={amountRupees}
                    onFocus={(e) => {
                      if (e.target.value === '0' || e.target.value === '0.00') {
                        setAmountRupees('');
                      } else {
                        e.target.select();
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^0+[1-9]/.test(val)) {
                        setAmountRupees(val.replace(/^0+/, ''));
                      } else {
                        setAmountRupees(val);
                      }
                    }}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-300 pl-8 pr-4 py-2 text-sm font-semibold text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Grid: Mode, Reference, Received By, Due Date */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    भुगतान का माध्यम (Payment Mode) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as 'cash' | 'upi' | 'bank' | 'cheque')}
                    className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="cash">Cash (नकद भुगतान / नकद रसीद)</option>
                    <option value="upi">Direct UPI / QR (Google Pay, PhonePe, Paytm, Shop QR)</option>
                    <option value="bank">Bank Transfer (NEFT / RTGS / IMPS)</option>
                    <option value="cheque">Cheque / Demand Draft (बैंक चेक)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Transaction Reference / UTR Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CASH-REC-01, UPI UTR 42819..., Cheque #102938"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    maxLength={200}
                    className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Received By (रकम प्राप्तकर्ता का नाम)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aniket Singh / Workshop Cashier"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    maxLength={200}
                    className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Installment Due Date (किस्त नियत तिथि)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Notes / Remarks (वैकल्पिक टिप्पणी)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Part payment before site delivery"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    maxLength={500}
                    className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {error && <p role="alert" className="text-xs text-red-600 font-semibold">{error}</p>}

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  रद्द करें (Cancel)
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-amber-700 hover:bg-amber-800 text-white gap-1.5 shadow-xs font-semibold"
                >
                  {submitting ? (
                    'दर्ज हो रहा है...'
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      Save Installment #{chronologicalPayments.length + 1}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {balanceRupees === 0 && (
        <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50/80 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-700" />
            <h4 className="text-sm font-bold text-emerald-900">
              100% Payment Received (PAID – ALL DONE)
            </h4>
          </div>
          <p className="mt-1 text-xs text-emerald-800">
            ₹0 balance due. All payment conditions for dispatch are satisfied.
          </p>
        </div>
      )}

      {/* Complete Installment History Table */}
      {hasPayments && (
        <div className="mt-5 border-t border-slate-200/80 pt-4">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Installment History (किस्त एवं भुगतान इतिहास)
            </h4>
            <span className="text-xs text-slate-500 font-medium">
              Total {chronologicalPayments.length} Payment{chronologicalPayments.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-3.5 py-2.5">Installment #</th>
                  <th className="px-3.5 py-2.5">Amount</th>
                  <th className="px-3.5 py-2.5">Payment Date</th>
                  <th className="px-3.5 py-2.5">Due Date</th>
                  <th className="px-3.5 py-2.5">Mode</th>
                  <th className="px-3.5 py-2.5">Reference / UTR</th>
                  <th className="px-3.5 py-2.5">Received By</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5 text-right">PDF Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chronologicalPayments.map((p, idx) => {
                  const instNum = p.installment_number || idx + 1;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="px-3.5 py-3 font-semibold text-slate-800">
                        <span className="inline-flex items-center gap-1">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] text-white">
                            {instNum}
                          </span>
                          {idx === 0 ? 'Advance' : `Installment #${instNum}`}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 font-bold text-slate-900">
                        ₹{(p.amount_minor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3.5 py-3 text-slate-600">
                        {new Date(p.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-3.5 py-3 text-slate-500">
                        {p.due_date ? new Date(p.due_date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                          {p.mode}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 font-mono text-[11px] text-slate-700 select-all">
                        {p.reference}
                      </td>
                      <td className="px-3.5 py-3 text-slate-600">
                        {p.received_by || '—'}
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          Paid ✓
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-right">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50 gap-1"
                        >
                          <a
                            href={`/api/v1/orders/${orderId}/receipt?payment_id=${p.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download size={12} />
                            Receipt
                          </a>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
