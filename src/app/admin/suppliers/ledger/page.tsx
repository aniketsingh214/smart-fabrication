'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Building2,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Plus,
  ArrowRight,
  Download,
  RefreshCw,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  CheckCircle2,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notify';
import { money, dateTime } from '@/lib/utils';

type SupplierChoice = {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  gst_number?: string;
};

type StatementEntry = {
  id: string;
  kind: 'invoice' | 'payment' | 'return';
  created_at: string;
  reference: string;
  delta_minor: number;
};

type StatementSummary = {
  invoiced_minor: number;
  returned_minor: number;
  paid_minor: number;
  outstanding_minor: number;
};

type PayableBill = {
  purchase_id: string;
  name: string;
  bill_number?: string;
  total_minor: number;
  outstanding_minor: number;
};

export default function SupplierLedgerPage() {
  const searchParams = useSearchParams();
  const initialSupplierId = searchParams.get('supplier') || '';

  // Supplier list state
  const [suppliers, setSuppliers] = useState<SupplierChoice[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(initialSupplierId);

  // Statement ledger state
  const [statementSummary, setStatementSummary] = useState<StatementSummary | null>(null);
  const [entries, setEntries] = useState<StatementEntry[]>([]);
  const [loadingStatement, setLoadingStatement] = useState(false);

  // Unpaid bills for specific payment allocation
  const [unpaidBills, setUnpaidBills] = useState<PayableBill[]>([]);

  // Payment Modal state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<'cash' | 'upi' | 'bank' | 'cheque'>('cash');
  const [payReference, setPayReference] = useState('');
  const [specificPurchaseId, setSpecificPurchaseId] = useState<string>('auto');
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Date Filter
  const [dateFilter, setDateFilter] = useState<'all' | 'month' | 'quarter'>('all');

  // Load suppliers list
  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const res = await fetch('/api/v1/admin/suppliers?limit=100');
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setSuppliers(json.data);
          if (!selectedSupplierId && json.data.length > 0) {
            setSelectedSupplierId(json.data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching suppliers:', err);
      } finally {
        setLoadingSuppliers(false);
      }
    }
    fetchSuppliers();
  }, [selectedSupplierId]);

  // Load Statement and Unpaid Bills when selectedSupplierId changes
  const loadStatement = async (supplierId: string) => {
    if (!supplierId) return;
    setLoadingStatement(true);
    try {
      // 1. Fetch statement
      const res = await fetch(`/api/v1/admin/suppliers/${supplierId}/statement?limit=100`);
      const json = await res.json();
      if (res.ok && json.data) {
        setStatementSummary(json.data.summary);
        setEntries(json.data.entries || []);
      }

      // 2. Fetch unpaid bills for this supplier
      const payablesRes = await fetch('/api/v1/finance/reconciliation');
      // Or fallback to direct purchase querying
      const pRes = await fetch(`/api/v1/admin/purchases?context=suppliers&context_id=${supplierId}&limit=50`);
      const pJson = await pRes.json();
      if (pJson.data && Array.isArray(pJson.data)) {
        const received = pJson.data
          .filter((p: any) => p.status === 'received')
          .map((p: any) => ({
            purchase_id: p.id,
            name: p.name || `Bill #${p.bill_number}`,
            bill_number: p.bill_number,
            total_minor: p.total_minor,
            outstanding_minor: p.total_minor, // conservative
          }));
        setUnpaidBills(received);
      }
    } catch (err) {
      console.error('Failed to load statement:', err);
    } finally {
      setLoadingStatement(false);
    }
  };

  useEffect(() => {
    if (selectedSupplierId) {
      loadStatement(selectedSupplierId);
    }
  }, [selectedSupplierId]);

  // Current selected supplier details
  const currentSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === selectedSupplierId);
  }, [suppliers, selectedSupplierId]);

  // Running balance ledger calculation
  // Reverse chronological to chronological running balance
  const ledgerRowsWithRunningBalance = useMemo(() => {
    // Sort chronological (oldest first) to compute running balance
    const sortedChronological = [...entries].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let runningBalance = 0;
    const computed = sortedChronological.map((item) => {
      // delta_minor: positive for invoice (adds to due), negative for payment/return (reduces due)
      runningBalance += Number(item.delta_minor);
      return {
        ...item,
        runningBalanceMinor: runningBalance,
      };
    });

    // Return in reverse chronological for UI display (newest first)
    return computed.reverse();
  }, [entries]);

  // Filtered rows by date
  const filteredLedgerRows = useMemo(() => {
    if (dateFilter === 'all') return ledgerRowsWithRunningBalance;
    const now = new Date();
    const days = dateFilter === 'month' ? 30 : 90;
    const threshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return ledgerRowsWithRunningBalance.filter((r) => new Date(r.created_at) >= threshold);
  }, [ledgerRowsWithRunningBalance, dateFilter]);

  // Handle Payment Submit
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) return;
    if (payAmount <= 0) {
      notify('कृपया मान्य भुगतान राशि दर्ज करें।', 'error');
      return;
    }
    if (!payReference.trim()) {
      notify('कृपया पेमेंट रेफरेंस या नोट दर्ज करें।', 'error');
      return;
    }

    setRecordingPayment(true);
    try {
      const payload: any = {
        supplier_id: selectedSupplierId,
        amount_minor: Math.round(payAmount * 100),
        mode: payMode,
        reference: payReference.trim(),
      };

      if (specificPurchaseId !== 'auto') {
        payload.purchase_id = specificPurchaseId;
      }

      const res = await fetch('/api/v1/purchases/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'भुगतान दर्ज नहीं हो सका।');
      }

      notify(`₹${payAmount.toLocaleString('en-IN')} का भुगतान सफलतापूर्वक दर्ज हो गया!`, 'success');
      setIsPaymentOpen(false);
      setPayAmount(0);
      setPayReference('');
      // Reload statement
      loadStatement(selectedSupplierId);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'त्रुटि हुई', 'error');
    } finally {
      setRecordingPayment(false);
    }
  };

  return (
    <div className="admin-operational-page space-y-6 pb-12">
      {/* Header and Breadcrumbs */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/workspaces/inventory"
              className="text-xs font-semibold text-slate-500 hover:text-teal-700"
            >
              इन्वेंट्री व खरीद (Inventory)
            </Link>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
              Page 3 — दुकानदार का खाता
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            दुकानदार का खाता (Supplier Ledger)
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            लोहा व्यापारियों व सप्लायर्स का पूरा बहीखाता—तारीखवार बिल, भुगतान और बकाया हिसाब।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild className="gap-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold">
            <Link href={`/admin/purchases/entry?supplier=${selectedSupplierId}`}>
              <Plus size={16} /> नई खरीदारी दर्ज करें
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/suppliers">सभी सप्लायर्स (Suppliers List)</Link>
          </Button>
        </div>
      </div>

      {/* Supplier Selector Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Building2 size={24} />
            </span>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                सप्लायर / लोहा व्यापारी चुनें:
              </label>
              {loadingSuppliers ? (
                <div className="text-xs text-slate-400 py-1">लोड हो रहे हैं...</div>
              ) : (
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="mt-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm sm:text-base font-bold text-slate-900 shadow-sm focus:border-teal-600"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Current Supplier Quick Contact Badge */}
          {currentSupplier && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
              {currentSupplier.phone && (
                <a
                  href={`tel:${currentSupplier.phone}`}
                  className="flex items-center gap-1.5 font-bold text-teal-800 hover:underline"
                >
                  <Phone size={14} />
                  {currentSupplier.phone}
                </a>
              )}
              {currentSupplier.address && (
                <span className="flex items-center gap-1.5 text-slate-500">
                  <MapPin size={14} />
                  {currentSupplier.address}
                </span>
              )}
              {currentSupplier.gst_number && (
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500">
                  GST: {currentSupplier.gst_number}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Supplier Statement Summary Cards */}
      {statementSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Invoiced */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Receipt size={15} className="text-blue-600" />
              कुल खरीदारी (Invoiced)
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-black text-slate-900">
              {money(statementSummary.invoiced_minor)}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">सप्लायर के कुल पक्के बिल</span>
          </div>

          {/* Paid */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <ArrowDownLeft size={15} className="text-emerald-700" />
              कुल भुगतान (Paid)
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-black text-emerald-700">
              {money(statementSummary.paid_minor)}
            </p>
            <span className="text-[10px] text-emerald-700/80 mt-0.5 block">
              अब तक दी गई कुल रकम
            </span>
          </div>

          {/* Returned */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <RotateCcw size={15} className="text-slate-500" />
              माल वापसी (Returned)
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-black text-slate-700">
              {money(statementSummary.returned_minor)}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">वापस लौटाया गया माल</span>
          </div>

          {/* Outstanding Due */}
          <div
            className={`rounded-2xl border-2 p-4 shadow-sm ${
              statementSummary.outstanding_minor > 0
                ? 'border-amber-300 bg-amber-50/80'
                : 'border-emerald-300 bg-emerald-50/80'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <CreditCard size={15} className="text-amber-800" />
              दुकानदार का कुल बकाया (Due)
            </div>
            <p
              className={`mt-2 text-xl sm:text-2xl font-black ${
                statementSummary.outstanding_minor > 0 ? 'text-amber-800' : 'text-emerald-800'
              }`}
            >
              {money(statementSummary.outstanding_minor)}
            </p>
            <span className="text-[10px] text-amber-800/80 mt-0.5 block">
              {statementSummary.outstanding_minor > 0
                ? 'यह रकम देनी बाकी है'
                : 'खाता चुकता है (No Due)'}
            </span>
          </div>
        </div>
      )}

      {/* Ledger Table & Action Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        {/* Table Top Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              बहीखाता विवरण (Transaction Ledger)
            </h2>
            <span className="text-xs text-slate-400">({filteredLedgerRows.length} प्रविष्टियां)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Filter Pills */}
            <div className="flex items-center gap-1 text-xs bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  dateFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                सभी समय
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('month')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  dateFilter === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                पिछले 30 दिन
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('quarter')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  dateFilter === 'quarter' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                पिछले 90 दिन
              </button>
            </div>

            {/* Record Payment Button */}
            <Button
              type="button"
              onClick={() => {
                setPayAmount(statementSummary?.outstanding_minor ? statementSummary.outstanding_minor / 100 : 0);
                setIsPaymentOpen(true);
              }}
              className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-8 text-xs"
            >
              <CreditCard size={14} />
              + पैसे दिए (Record Payment)
            </Button>
          </div>
        </div>

        {/* Ledger Table */}
        {loadingStatement ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-teal-700" />
            बहीखाता लोड हो रहा है...
          </div>
        ) : filteredLedgerRows.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
            <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-700">कोई लेन-देन नहीं मिला</h4>
            <p className="text-xs text-slate-400 mt-1">
              इस सप्लायर के साथ अभी कोई बिल या पेमेंट दर्ज नहीं की गई है।
            </p>
            <Button asChild size="sm" className="mt-3 bg-teal-700 hover:bg-teal-800">
              <Link href={`/admin/purchases/entry?supplier=${selectedSupplierId}`}>
                + पहली खरीदारी दर्ज करें
              </Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-3">तारीख (Date)</th>
                  <th className="px-3.5 py-3">प्रकार (Type)</th>
                  <th className="px-3.5 py-3">विवरण / बिल रेफरेंस</th>
                  <th className="px-3.5 py-3 text-right">खरीदारी (Debit ₹)</th>
                  <th className="px-3.5 py-3 text-right">भुगतान (Credit ₹)</th>
                  <th className="px-3.5 py-3 text-right">बाकी रकम (Balance ₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLedgerRows.map((entry) => {
                  const isInvoice = entry.kind === 'invoice';
                  const isPayment = entry.kind === 'payment';
                  const isReturn = entry.kind === 'return';

                  return (
                    <tr key={entry.kind + entry.id} className="hover:bg-slate-50/70 transition-all">
                      <td className="px-3.5 py-3 text-slate-600 whitespace-nowrap">
                        {dateTime(entry.created_at)}
                      </td>
                      <td className="px-3.5 py-3">
                        {isInvoice && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200">
                            <Receipt size={11} />
                            खरीदारी (Bill)
                          </span>
                        )}
                        {isPayment && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                            <ArrowDownLeft size={11} />
                            भुगतान (Payment)
                          </span>
                        )}
                        {isReturn && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                            <RotateCcw size={11} />
                            वापसी (Return)
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="font-bold text-slate-900">{entry.reference}</div>
                        {isInvoice && (
                          <Link
                            href={`/admin/purchases?record=${entry.id}`}
                            className="text-[11px] text-teal-700 hover:underline font-semibold"
                          >
                            बिल का सामान देखें →
                          </Link>
                        )}
                      </td>
                      {/* Debit (Purchase) */}
                      <td className="px-3.5 py-3 text-right font-bold text-slate-900">
                        {isInvoice ? money(entry.delta_minor) : '—'}
                      </td>
                      {/* Credit (Payment / Return) */}
                      <td className="px-3.5 py-3 text-right font-bold text-emerald-700">
                        {!isInvoice ? money(Math.abs(entry.delta_minor)) : '—'}
                      </td>
                      {/* Running Balance */}
                      <td className="px-3.5 py-3 text-right font-extrabold text-sm text-slate-900">
                        {money(entry.runningBalanceMinor)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECORD PAYMENT MODAL */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  + दुकानदार को भुगतान दर्ज करें (Record Payment)
                </h3>
                <p className="text-xs text-slate-500">{currentSupplier?.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              {/* Outstanding Due Banner */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex justify-between items-center text-xs">
                <span className="font-semibold text-amber-900">सप्लायर का कुल बकाया:</span>
                <span className="font-black text-amber-800 text-sm">
                  {statementSummary ? money(statementSummary.outstanding_minor) : '₹0'}
                </span>
              </div>

              {/* Payment Allocation Option */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  भुगतान का आवंटन (Allocation):
                </label>
                <select
                  value={specificPurchaseId}
                  onChange={(e) => setSpecificPurchaseId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-medium text-slate-900 shadow-sm"
                >
                  <option value="auto">
                    बकाया बिलों में अपने आप बाँटें (Auto FIFO Allocation)
                  </option>
                  {unpaidBills.map((b) => (
                    <option key={b.purchase_id} value={b.purchase_id}>
                      {b.name} (कुल: {money(b.total_minor)})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  'Auto FIFO' चुनने पर पुराने बिल पहले चुकता होंगे।
                </span>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  भुगतान की राशि (Payment Amount ₹) *:
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-base font-bold text-slate-900 shadow-sm"
                />
              </div>

              {/* Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    माध्यम (Payment Mode):
                  </label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-medium text-slate-900 shadow-sm"
                  >
                    <option value="cash">नकद (Cash)</option>
                    <option value="upi">UPI (GPay/PhonePe)</option>
                    <option value="bank">बैंक (NEFT/RTGS)</option>
                    <option value="cheque">चेक (Cheque)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    रेफरेंस / विवरण *:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. GPay Txn / Cash"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 shadow-sm"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPaymentOpen(false)}
                  disabled={recordingPayment}
                >
                  रद्द करें
                </Button>
                <Button
                  type="submit"
                  disabled={recordingPayment || payAmount <= 0}
                  className="bg-emerald-700 hover:bg-emerald-800 gap-1.5"
                >
                  {recordingPayment ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      सहेज रहे हैं...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      भुगतान सहेजें (Save Payment)
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
