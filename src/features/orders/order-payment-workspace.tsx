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
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  amount_minor: number;
  mode: string;
  reference: string;
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
  const [refreshing,setRefreshing]=useState(false);
  const [balanceFresh,setBalanceFresh]=useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [amountRupees, setAmountRupees] = useState('');
  const [mode, setMode] = useState<'cash' | 'upi' | 'bank' | 'cheque'>('upi');
  const [reference, setReference] = useState('');
  const [gatewayReady, setGatewayReady] = useState(false);
  const paymentAttempt=useRef<{signature:string;key:string}|null>(null);
  const paymentInFlight=useRef(false);

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

      // Pre-fill default advance (e.g. 30% of total if not paid yet, or remaining balance)
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
      setError(e instanceof Error?e.message:'Payments could not be loaded. Refresh to retry.');
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
    const calc = percent===100?summary.balanceDueMinor/100:Math.min(summary.balanceDueMinor/100,Math.round(total*percent)/100);
    setAmountRupees(String(calc));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(paymentInFlight.current||refreshing||!summary)return;
    setError('');
      setSuccessMsg('Payment receipt saved successfully.');
    const amtNum = parseFloat(amountRupees);
    if (!amtNum || amtNum <= 0) {
      setError('कृपया मान्य अग्रिम राशि दर्ज करें (Enter a valid positive amount)');
      return;
    }
    if(!Number.isFinite(amtNum)||Math.round(amtNum*100)>summary.balanceDueMinor){setError('Amount cannot exceed the remaining balance.');return;}
    if (!reference.trim()) {
      setError('भुगतान संदर्भ / UTR नंबर दर्ज करें (Reference / Transaction ID required)');
      return;
    }

    paymentInFlight.current=true;
    const signature=JSON.stringify([Math.round(amtNum*100),mode,reference.trim(),gatewayReady]);
    if(paymentAttempt.current?.signature!==signature)paymentAttempt.current={signature,key:crypto.randomUUID()};
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/advance-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json','Idempotency-Key':paymentAttempt.current!.key },
        body: JSON.stringify({
          amount_minor: Math.round(amtNum * 100),
          mode,
          reference: reference.trim(),
          gateway_ready: gatewayReady,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Payment recording failed');

      notify('Payment recorded successfully.');
      setSuccessMsg('Payment receipt saved. The outstanding balance has been updated.');
      paymentAttempt.current=null;
      setReference('');
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
      paymentInFlight.current=false;
      setSubmitting(false);
      setRefreshing(false);
    }
  };

  const totalRupees = summary ? summary.totalMinor / 100 : Number(order.total_minor || 0) / 100;
  const paidRupees = summary ? summary.totalPaidMinor / 100 : 0;
  const balanceRupees = summary ? summary.balanceDueMinor / 100 : totalRupees;
  const percentPaid = totalRupees > 0 ? Math.min(100, Math.round((paidRupees / totalRupees) * 100)) : 0;
  const balancePayment=Boolean(summary&&(summary.totalPaidMinor>0||summary.status==='COMPLETED'));
  const hasPayments = summary && summary.payments && summary.payments.length > 0;

  return (
    <div className="mt-6 rounded-xl border border-orange-200 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 p-5 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-white shadow-sm">
              <CreditCard size={16} />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Order Payments &amp; Receipts (Two-Payment Policy)
            </h3>
            {balanceRupees === 0 ? (
              <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-600" /> PAID – ALL DONE
              </span>
            ) : paidRupees > 0 ? (
              <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-800 flex items-center gap-1">
                <AlertCircle size={13} className="text-amber-600" /> ADVANCE RECEIVED
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                UNPAID (Advance Pending)
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Payment 1: Advance (Starts production) · Payment 2: Next Payment – ALL DONE (Required before dispatch)
          </p>
        </div>

        {/* Download Receipt CTA Button */}
        {hasPayments && (
          <Button asChild className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm">
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

      {/* Two-Payment Workflow Cards */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Payment 1 Card */}
        <div className={`rounded-lg border p-3 text-xs ${paidRupees > 0 ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/60'}`}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white text-[10px]">1</span>
              Payment 1: Advance Payment
            </span>
            <span className={`rounded px-1.5 py-0.5 font-bold text-[10px] uppercase ${paidRupees > 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'}`}>
              {paidRupees > 0 ? 'Recorded ✓' : 'Pending'}
            </span>
          </div>
          <p className="mt-1 text-slate-600">
            {paidRupees > 0
              ? 'Advance recorded. Workshop production is authorized to proceed.'
              : 'Advance payment collected upon confirmation to initiate workshop fabrication.'}
          </p>
        </div>

        {/* Payment 2 Card */}
        <div className={`rounded-lg border p-3 text-xs ${balanceRupees === 0 ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-slate-50/60'}`}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white text-[10px]">2</span>
              Payment 2: Next Payment (ALL DONE)
            </span>
            <span className={`rounded px-1.5 py-0.5 font-bold text-[10px] uppercase ${balanceRupees === 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}>
              {balanceRupees === 0 ? 'PAID – ALL DONE ✓' : `Due: ₹${balanceRupees.toLocaleString('en-IN')}`}
            </span>
          </div>
          <p className="mt-1 text-slate-600">
            {balanceRupees === 0
              ? '100% full balance received. Order is cleared for dispatch.'
              : 'Full remaining balance must be collected before dispatch can proceed.'}
          </p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Order Amount */}
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Order Amount (कुल रकम)
          </span>
          <p className="mt-1 text-lg font-bold text-slate-900">
            ₹{totalRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Advance Received */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Total Paid (प्राप्त रकम)
            </span>
            <span className="rounded-full bg-emerald-200/70 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
              {percentPaid}%
            </span>
          </div>
          <p className="mt-1 text-lg font-bold text-emerald-700">
            ₹{paidRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Balance Due */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3.5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Balance Due (बाकी रकम)
          </span>
          <p
            className={`mt-1 text-lg font-bold ${
              balanceRupees > 0 ? 'text-amber-800' : 'text-emerald-700'
            }`}
          >
            ₹{balanceRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
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
              ? `Payments received (${percentPaid}% covered)`
              : 'Advance pending — record receipt below'}
          </span>
          <span>{balanceRupees === 0 ? 'Fully Paid' : `₹${balanceRupees.toLocaleString('en-IN')} remaining`}</span>
        </div>
      </div>

      {refreshing&&<p role="status" className="mt-3 text-sm text-slate-500">Payment saved. Updating balance...</p>}
      {loading&&<p role="status" className="mt-3 text-sm text-slate-500">Loading payment balance...</p>}
      {/* Action / Record Payment Section */}
      {summary&&!refreshing&&balanceFresh&&canWriteFinance&&summary.status!=='CANCELLED'&&balanceRupees>0&& (
        <div className="mt-4">
          {!showForm ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(true)}
              className="w-full gap-2 border-orange-300 bg-white hover:bg-orange-50 font-semibold text-orange-900"
            >
              <Banknote size={16} />
              {balancePayment?'Record Next Payment – ALL DONE (Payment 2 of 2)':'Record Advance Payment (Payment 1 of 2)'}
              <ChevronDown size={15} />
            </Button>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-lg border border-orange-200 bg-white p-4 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Banknote size={16} className="text-orange-600" />
                  {balancePayment?'Record Next Payment – ALL DONE (Payment 2 of 2)':'Record Advance Payment (Payment 1 of 2)'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  छिपाएं <ChevronUp size={13} />
                </button>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block max-w-md text-sm font-semibold text-slate-800">
                  भुगतान का माध्यम (Payment Mode) *
                  <select
                    aria-label="भुगतान का माध्यम (Payment Mode)"
                    value={mode}
                    onChange={(e) => setMode(e.target.value as 'cash' | 'upi' | 'bank' | 'cheque')}
                    className="mt-2"
                  >
                    <option value="upi">UPI / QR (Google Pay, PhonePe, Paytm, QR Scan)</option>
                    <option value="cash">Cash (नकद भुगतान)</option>
                    <option value="bank">Bank Transfer (NEFT / RTGS / IMPS)</option>
                    <option value="cheque">Cheque / Demand Draft (बैंक चेक)</option>
                  </select>
                  <span className="mt-2 block text-xs font-normal text-slate-500">
                    Choose how the customer paid. Partial and final balance payments are supported.
                  </span>
                </label>
              </div>

              {/* Amount Input with Quick Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {balancePayment ? 'अंतिम राशि (Remaining Balance in ₹) *' : 'अग्रिम राशि (Advance Amount in ₹) *'}
                  </label>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">त्वरित सुझाव:</span>
                    {!balancePayment ? (
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
                          className="rounded bg-orange-100 hover:bg-orange-200 px-1.5 py-0.5 text-[11px] font-medium text-orange-800"
                        >
                          30% (Recommended)
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
                      {balancePayment ? `Full Remaining (₹${balanceRupees.toLocaleString('en-IN')})` : 'Full Payment'}
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
                    className="w-full rounded-lg border border-slate-300 pl-8 pr-4 py-2 text-sm font-semibold text-slate-900 focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
                {balancePayment && (
                  <p className="mt-1 text-[11px] text-amber-800 font-medium">
                    Next Payment collects the full balance to mark status as PAID – ALL DONE before dispatch.
                  </p>
                )}
              </div>

              {/* Reference / UTR Input */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  संदर्भ / UTR / चेक / वाउचर नंबर (Reference ID) *
                </label>
                <input
                  type="text"
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={
                    mode === 'upi'
                      ? 'उदा. UPI Ref 412389472911'
                      : mode === 'bank'
                      ? 'उदा. NEFT UTR / IMPS Ref ID'
                      : mode === 'cheque'
                      ? 'उदा. Cheque No 000412 (SBI Bank)'
                      : 'उदा. Cash Voucher #102 / नकद रसीद'
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              {/* Gateway Ready Mode Card */}
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gatewayReady}
                    onChange={(e) => setGatewayReady(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-indigo-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-indigo-600" />
                      Payment Gateway Architecture Ready
                    </span>
                    <p className="mt-0.5 text-[11px] text-indigo-800/80 leading-normal">
                      Gateway Ready मोड सक्षम करने पर भुगतान रिकॉर्ड में गेटवे-तैयार मेटाडेटा संलग्न होता है। (Razorpay / Cashfree एकीकरण के लिए पूरी तरह तैयार)
                    </p>
                  </div>
                </label>
              </div>

              {error && (
                <p role="alert" className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={13} /> {error}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={submitting}
                  onClick={() => setShowForm(false)}
                >
                  रद्द करें (Cancel)
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-orange-600 hover:bg-orange-700 text-white gap-1.5 shadow-sm"
                >
                  {submitting ? (
                    'दर्ज हो रहा है...'
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      {balancePayment?'Save Next Payment – ALL DONE':'Save Advance Payment'}
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

      {/* Workflow & Dispatch Readiness Checklist */}
      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-orange-600" />
            Order Workflow &amp; Dispatch Readiness
          </h4>
          <span className="text-[11px] text-slate-500 font-medium">
            Stage: <span className="font-bold text-slate-800">{summary?.status || String(order.status || 'CONFIRMED')}</span>
          </span>
        </div>

        <div className="mt-3 space-y-2.5 text-xs">
          {/* 1. Advance Payment Gate */}
          <div className="flex items-start justify-between gap-3 p-2 rounded bg-slate-50">
            <div>
              <span className="font-semibold text-slate-800">1. Advance Payment (Payment 1)</span>
              <p className="text-[11px] text-slate-500">Unlocks workshop production authorization</p>
            </div>
            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${paidRupees > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {paidRupees > 0 ? 'Recorded ✓' : 'Pending'}
            </span>
          </div>

          {/* 2. Production Stage */}
          <div className="flex items-start justify-between gap-3 p-2 rounded bg-slate-50">
            <div>
              <span className="font-semibold text-slate-800">2. Workshop Production</span>
              <p className="text-[11px] text-slate-500">
                {['READY', 'OUT_FOR_DELIVERY', 'INSTALLATION', 'COMPLETED'].includes(summary?.status || String(order.status))
                  ? 'Fabrication completed & ready for dispatch'
                  : ['PRODUCTION_STARTED', 'FABRICATION_COMPLETED', 'FINISHING'].includes(summary?.status || String(order.status))
                  ? 'Production in progress'
                  : 'Pending production start'}
              </p>
            </div>
            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${['READY', 'OUT_FOR_DELIVERY', 'INSTALLATION', 'COMPLETED'].includes(summary?.status || String(order.status)) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
              {['READY', 'OUT_FOR_DELIVERY', 'INSTALLATION', 'COMPLETED'].includes(summary?.status || String(order.status)) ? 'Completed ✓' : (summary?.status || String(order.status)).replace(/_/g, ' ')}
            </span>
          </div>

          {/* 3. 100% Payment Gate (Strict Dispatch Guard) */}
          <div className={`flex flex-col gap-1 p-2.5 rounded border ${balanceRupees === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50/60 border-red-200'}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">3. 100% Payment (Next Payment – ALL DONE)</span>
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${balanceRupees === 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'}`}>
                {balanceRupees === 0 ? 'PAID – ALL DONE ✓' : 'Payment Required'}
              </span>
            </div>
            {balanceRupees === 0 ? (
              <p className="text-[11px] text-emerald-800 font-medium">
                ✓ Full payment verified. Balance Due is ₹0. Order is cleared for dispatch.
              </p>
            ) : (
              <p className="text-[11px] font-semibold text-red-700">
                ⚠️ 100% payment is required before dispatch. Please complete the Next Payment (ALL DONE).
              </p>
            )}
          </div>

          {/* 4. Dispatch Stage */}
          <div className="flex items-start justify-between gap-3 p-2 rounded bg-slate-50">
            <div>
              <span className="font-semibold text-slate-800">4. Order Dispatch (Out for Delivery)</span>
              <p className="text-[11px] text-slate-500">
                {['OUT_FOR_DELIVERY', 'INSTALLATION', 'COMPLETED'].includes(summary?.status || String(order.status))
                  ? 'Dispatched to customer site'
                  : balanceRupees === 0 && ['READY'].includes(summary?.status || String(order.status))
                  ? 'Eligible for dispatch'
                  : 'Dispatch blocked until 100% payment received and production ready'}
              </p>
            </div>
            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${['OUT_FOR_DELIVERY', 'INSTALLATION', 'COMPLETED'].includes(summary?.status || String(order.status)) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
              {['OUT_FOR_DELIVERY', 'INSTALLATION', 'COMPLETED'].includes(summary?.status || String(order.status)) ? 'Dispatched' : 'Pending'}
            </span>
          </div>

          {/* 5. Delivery & Installation Sign-offs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2 rounded bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-800 block text-[11px]">5. Delivery Sign-off</span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Customer delivery sign-off is required before completing delivery.
              </p>
            </div>
            <div className="p-2 rounded bg-slate-50 border border-slate-100">
              <span className="font-semibold text-slate-800 block text-[11px]">6. Installation Sign-off</span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Customer installation sign-off is required before completing installation.
              </p>
            </div>
          </div>

          {/* 6. Overall Order Completion */}
          <div className="p-2 rounded bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 block text-[11px]">7. Order Completion</span>
              <p className="text-[10px] text-slate-500">
                {summary?.status === 'COMPLETED'
                  ? 'All 8 workflow conditions and customer sign-offs completed.'
                  : 'Order cannot be completed. Please finish all pending workflow stages and obtain the required customer sign-offs.'}
              </p>
            </div>
            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${summary?.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
              {summary?.status === 'COMPLETED' ? 'COMPLETED ✓' : 'In Progress'}
            </span>
          </div>
        </div>
      </div>

      {summary?.status==='COMPLETED'&&balanceRupees>0&&<p className="mt-3 text-sm font-semibold text-amber-800">Work completed. Balance payment is still pending; record the amount received below.</p>}
      {error&&!showForm&&<div className="mt-3"><p role="alert" className="text-sm text-red-700">{error}</p>{!balanceFresh&&<Button type="button" variant="outline" className="mt-2" disabled={refreshing} onClick={async()=>{setRefreshing(true);await loadSummary();setRefreshing(false);}}>Refresh payment balance</Button>}</div>}
      {successMsg && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 size={15} className="text-emerald-600" />
            {successMsg}
          </span>
          <Button asChild size="sm" variant="outline" className="h-7 text-xs bg-white text-emerald-800 border-emerald-300">
            <a href={`/api/v1/orders/${orderId}/receipt`} target="_blank" rel="noopener noreferrer">
              रसीद PDF <Download size={12} className="ml-1" />
            </a>
          </Button>
        </div>
      )}

      {/* Receipts History List */}
      {hasPayments && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            दर्ज रसीदें (Recorded Receipts)
          </h4>
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white overflow-hidden text-xs">
            {summary.payments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-3 hover:bg-slate-50/70">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      ₹{(p.amount_minor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 uppercase">
                      {p.mode}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ref: {p.reference} · {new Date(p.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-orange-700 hover:text-orange-800">
                  <a
                    href={`/api/v1/orders/${orderId}/receipt?payment_id=${p.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    रसीद देखें (PDF) <Download size={12} className="ml-1" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
