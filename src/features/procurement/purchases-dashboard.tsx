import React from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  CreditCard,
  Building2,
  Package,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { money, dateTime } from '@/lib/utils';

export type DashboardSummaryData = {
  thisMonthPurchasesMinor: number;
  thisMonthPaymentsMinor: number;
  totalDueMinor: number;
  totalSuppliersCount: number;
  recentPurchases: Array<{
    id: string;
    bill_number?: string;
    supplier_name: string;
    bill_date: string;
    total_minor: number;
    status: string;
  }>;
  suppliersWithDue: Array<{
    id: string;
    name: string;
    phone?: string;
    outstanding_minor: number;
  }>;
};

export function PurchasesDashboard({ data }: { data: DashboardSummaryData }) {
  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-800">
              Page 1 — खरीदारी डैशबोर्ड
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">Inventory & Procurement</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            खरीदारी डैशबोर्ड (Purchases Dashboard)
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            आज और इस महीने की खरीदारी, दुकानदारों का बकाया और वर्कशॉप का माल नियंत्रण।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild className="gap-2 bg-teal-700 hover:bg-teal-800 text-white font-bold">
            <Link href="/admin/purchases/entry">
              <Plus size={16} />
              + नई खरीदारी दर्ज करें
            </Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/admin/suppliers/ledger">दुकानदारों के खाते (Ledger)</Link>
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* This Month's Purchases */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">इस महीने की खरीद</span>
            <span className="rounded-lg bg-blue-50 p-1.5 text-blue-700">
              <ShoppingCart size={16} />
            </span>
          </div>
          <p className="mt-3 text-xl sm:text-2xl font-black text-slate-900">
            {money(data.thisMonthPurchasesMinor)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">पाइप, एंगल, चादर व हार्डवेयर</span>
        </div>

        {/* Total Payments Made */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-bold">कुल भुगतान (Paid)</span>
            <span className="rounded-lg bg-emerald-100 p-1.5 text-emerald-800">
              <CreditCard size={16} />
            </span>
          </div>
          <p className="mt-3 text-xl sm:text-2xl font-black text-emerald-700">
            {money(data.thisMonthPaymentsMinor)}
          </p>
          <span className="text-[11px] text-emerald-700/80 mt-1 block">सप्लायर्स को दी गई रकम</span>
        </div>

        {/* Suppliers Outstanding Due */}
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-xs font-bold">दुकानदारों का बकाया</span>
            <span className="rounded-lg bg-amber-100 p-1.5 text-amber-800">
              <AlertCircle size={16} />
            </span>
          </div>
          <p className="mt-3 text-xl sm:text-2xl font-black text-amber-800">
            {money(data.totalDueMinor)}
          </p>
          <span className="text-[11px] text-amber-800/80 mt-1 block">
            {data.totalDueMinor > 0 ? 'देनी बाकी रकम' : 'खाता चुकता है'}
          </span>
        </div>

        {/* Total Suppliers Count */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">कुल दुकानदार</span>
            <span className="rounded-lg bg-slate-100 p-1.5 text-slate-700">
              <Building2 size={16} />
            </span>
          </div>
          <p className="mt-3 text-xl sm:text-2xl font-black text-slate-900">
            {data.totalSuppliersCount}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">पंजीकृत लोहा व हार्डवेयर डीलर</span>
        </div>
      </div>

      {/* 5 Main Hub Navigation Cards */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          मुख्य सुविधाएं (Quick Access)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/admin/purchases/entry"
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800 group-hover:bg-teal-700 group-hover:text-white transition-all">
                <Plus size={18} />
              </span>
              <ArrowRight size={15} className="text-slate-400 group-hover:text-teal-700 transition-all" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900">नई खरीदारी दर्ज करें</h3>
            <p className="mt-1 text-[11px] text-slate-500">
              पाइप, एंगल, चादर व सामान का बिल और पेमेंट तुरंत चढ़ाएं।
            </p>
          </Link>

          <Link
            href="/admin/suppliers/ledger"
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-800 group-hover:bg-blue-700 group-hover:text-white transition-all">
                <Building2 size={18} />
              </span>
              <ArrowRight size={15} className="text-slate-400 group-hover:text-blue-700 transition-all" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900">दुकानदारों के खाते</h3>
            <p className="mt-1 text-[11px] text-slate-500">
              Supplier Ledger, तारीखवार बिल, दिए गए पैसे व बकाया।
            </p>
          </Link>

          <Link
            href="/admin/purchases"
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800 group-hover:bg-indigo-700 group-hover:text-white transition-all">
                <ShoppingCart size={18} />
              </span>
              <ArrowRight size={15} className="text-slate-400 group-hover:text-indigo-700 transition-all" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900">सभी खरीदारी रजिस्टर</h3>
            <p className="mt-1 text-[11px] text-slate-500">
              सभी सप्लायर्स के बिलों की पूरी सूची, फ़िल्टर व विवरण।
            </p>
          </Link>

          <Link
            href="/admin/raw-materials"
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800 group-hover:bg-teal-700 group-hover:text-white transition-all">
                <Layers size={18} />
              </span>
              <ArrowRight size={15} className="text-slate-400 group-hover:text-teal-700 transition-all" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900">कच्चा माल व धर्म कांटा</h3>
            <p className="mt-1 text-[11px] text-slate-500">
              14 श्रेणियां, 30+ सामान, यूनिट कनवर्टर व कांटा पर्ची मिलान।
            </p>
          </Link>
        </div>
      </div>

      {/* Two Column Layout: Recent Purchases & Suppliers With Due */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Purchases Table (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">हाल ही की खरीदारी (Recent Purchases)</h3>
            </div>
            <Link
              href="/admin/purchases"
              className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
            >
              सभी देखें ({data.recentPurchases.length}) →
            </Link>
          </div>

          {data.recentPurchases.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">अभी तक कोई खरीदारी दर्ज नहीं की गई।</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">तारीख</th>
                    <th className="px-3 py-2">बिल #</th>
                    <th className="px-3 py-2">सप्लायर</th>
                    <th className="px-3 py-2 text-right">रकम (₹)</th>
                    <th className="px-3 py-2 text-center">स्थिति</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentPurchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                        {p.bill_date ? new Date(p.bill_date).toLocaleDateString('hi-IN') : '—'}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-slate-900">
                        {p.bill_number || 'Bill'}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-700 truncate max-w-[140px]">
                        {p.supplier_name}
                      </td>
                      <td className="px-3 py-2.5 text-right font-extrabold text-teal-900">
                        {money(p.total_minor)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            p.status === 'received'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status === 'received' ? 'स्टॉक प्राप्त' : 'ड्राफ्ट'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Suppliers With Outstanding Due (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-700" />
              <h3 className="text-sm font-bold text-slate-900">
                जिन दुकानदारों के पैसे बाकी हैं (Suppliers Due)
              </h3>
            </div>
            <Link
              href="/admin/suppliers/ledger"
              className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
            >
              खाते →
            </Link>
          </div>

          {data.suppliersWithDue.length === 0 ? (
            <p className="text-xs text-emerald-700 font-medium py-6 text-center">
              सभी दुकानदारों का खाता चुकता है! कोई बकाया नहीं।
            </p>
          ) : (
            <div className="space-y-2.5">
              {data.suppliersWithDue.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 hover:bg-amber-50/50 transition-all"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{s.name}</h4>
                    {s.phone && <p className="text-[11px] text-slate-400">{s.phone}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-amber-800 block">
                      {money(s.outstanding_minor)}
                    </span>
                    <Link
                      href={`/admin/suppliers/ledger?supplier=${s.id}`}
                      className="text-[10px] text-teal-700 font-bold hover:underline"
                    >
                      खाता देखें →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
