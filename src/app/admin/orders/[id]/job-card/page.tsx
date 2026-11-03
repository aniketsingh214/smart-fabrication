import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { serverClient } from '@/lib/supabase/server';
import { generateQrDataUrl } from '@/lib/qrcode/service';
import { money, dateTime } from '@/lib/utils';
import { Printer, ArrowLeft, CheckSquare, ShieldCheck, Factory } from 'lucide-react';

export const metadata = {
  title: 'Workshop Job Card | GateWala SmartFabrication'
};

interface JobCardPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobCardPage({ params }: JobCardPageProps) {
  const { id } = await params;
  const db = await serverClient();

  // 1. Check user authentication & permissions
  const {
    data: { user }
  } = await db.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/admin/orders/${id}/job-card`)}`);

  const { data: grants } = await db.rpc('my_permissions');
  const permissions: string[] = grants ?? [];
  if (!permissions.includes('orders.read') && !permissions.includes('production.read') && !permissions.includes('work-orders.read')) {
    return (
      <main className="mx-auto max-w-xl p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">Access Restricted</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your staff account does not have permission to view workshop job cards.
        </p>
        <Link href="/admin/orders" className="mt-4 inline-block text-xs font-semibold text-orange-600 underline">
          ← Back to orders
        </Link>
      </main>
    );
  }

  // 2. Fetch order record
  const { data: order, error: orderErr } = await db
    .from('orders')
    .select('id, record_code, name, status, total_minor, due_at, quotation_version_id, created_at')
    .eq('id', id)
    .maybeSingle();

  if (orderErr || !order) notFound();

  // 3. Fetch quotation version & snapshot items
  let snapshotItems: { description: string; quantity: number; unit_minor: number }[] = [];
  let customer: { name?: string | null; phone?: string | null; email?: string | null; address?: string | null } | null = null;

  if (order.quotation_version_id) {
    const { data: qv } = await db
      .from('quotation_versions')
      .select('quotation_id, snapshot')
      .eq('id', order.quotation_version_id)
      .maybeSingle();

    if (qv?.snapshot && typeof qv.snapshot === 'object' && 'items' in qv.snapshot && Array.isArray((qv.snapshot as Record<string, unknown>).items)) {
      snapshotItems = (qv.snapshot as Record<string, unknown>).items as { description: string; quantity: number; unit_minor: number }[];
    }

    if (qv?.quotation_id) {
      const { data: q } = await db
        .from('quotations')
        .select('customer_id')
        .eq('id', qv.quotation_id)
        .maybeSingle();

      if (q?.customer_id) {
        const { data: c } = await db
          .from('customers')
          .select('name, phone, email, address')
          .eq('id', q.customer_id)
          .maybeSingle();
        customer = c ?? null;
      }
    }
  }

  // 4. Generate QR code pointing to live order page
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smartfabrication.vercel.app';
  const trackingUrl = `${siteUrl}/account/orders/${order.id}`;
  const qrDataUrl = await generateQrDataUrl(trackingUrl);

  const orderCode = order.record_code || `ORD-${order.id.slice(0, 8).toUpperCase()}`;

  const stages = [
    { num: 1, hi: 'कच्चा माल कटिंग व सफाई', en: 'Material Cutting & Deburring', desc: 'Check pipe wall thickness & 45/90° cut precision' },
    { num: 2, hi: 'फ्रेम गुनिया व टांका वेल्डिंग', en: 'Frame 90° Squareness & Tack Weld', desc: 'Verify corner diagonal measurement before full seam' },
    { num: 3, hi: 'पक्की मजबूत वेल्डिंग', en: 'Full Joint Penetration Welding', desc: 'Continuous weld without porosity or pinholes' },
    { num: 4, hi: 'ग्राइंडिंग व घिसाई फिनिशिंग', en: 'Grinding, Smoothing & Buffing', desc: 'Level joint seams flush with adjacent pipe surfaces' },
    { num: 5, hi: 'कब्जे, लॉक व बेरिंग फिटिंग', en: 'Hardware: Hinges, Locks & Rollers', desc: 'Ensure smooth swing / slide motion and zero wobble' },
    { num: 6, hi: 'रेड ऑक्साइड प्राइमर कोट', en: 'Anti-Rust Red Oxide Primer Coat', desc: '100% surface coverage including hidden weld corners' },
    { num: 7, hi: 'फाइनल पेंट / पाउडर कोटिंग', en: 'Final Duco / Enamel / PVD Finish', desc: 'Uniform thickness and smooth matte / gloss texture' },
    { num: 8, hi: 'फाइनल क्वालिटी चेकिंग व लोडिंग', en: 'Final QC Pass & Transport Prep', desc: 'Protection foam on edges & supervisor sign-off' }
  ];

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:bg-white print:p-0">
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="mx-auto mb-6 max-w-4xl flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 p-4 text-white shadow-lg print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
          >
            <ArrowLeft size={14} />
            <span>Back to Orders</span>
          </Link>
          <div>
            <h1 className="text-sm font-bold">Workshop Job Card / कारखाना जॉब कार्ड</h1>
            <p className="text-xs text-slate-400">Order: {orderCode} · {order.name}</p>
          </div>
        </div>

        {/* Client Print Trigger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-action="print"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-orange-500 active:scale-95 transition cursor-pointer"
          >
            <Printer size={15} />
            <span>Print Job Card (प्रिंट करें)</span>
          </button>
        </div>
      </div>

      {/* Actual A4 Printable Sheet */}
      <article
        id="job-card-sheet"
        className="mx-auto max-w-4xl rounded-2xl border border-slate-300 bg-white p-8 shadow-md print:border-0 print:p-4 print:shadow-none print:w-full print:max-w-none text-slate-900"
      >
        {/* Header with GateWala Emblem & Order Code */}
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-orange-600 pb-5">
          <div>
            <div className="flex items-center gap-2 text-orange-600">
              <Factory size={22} />
              <span className="font-extrabold tracking-wider text-xs uppercase text-orange-700">GateWala Steel &amp; Fabrication</span>
            </div>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 uppercase">
              WORKSHOP JOB CARD <span className="text-lg font-bold text-slate-500">(कारखाना जॉब कार्ड)</span>
            </h1>
            <p className="text-xs text-slate-500">
              Fabrication Shop Floor Ticket · Heavy-Duty Metal &amp; Welding Standards
            </p>
          </div>

          <div className="flex flex-col items-end">
            <div className="rounded-lg border-2 border-amber-300 bg-amber-50 px-3.5 py-1 text-right">
              <span className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider">JOB / ORDER NUMBER</span>
              <span className="text-xl font-mono font-black text-amber-950">{orderCode}</span>
            </div>
            <span className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
              STAGE: {String(order.status).replace(/_/g, ' ')}
            </span>
          </div>
        </header>

        {/* 2-Column Meta Details: Customer & Timelines */}
        <section className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Box 1: Customer & Destination */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Customer &amp; Site Location / ग्राहक व साइट
            </h2>
            <p className="text-sm font-bold text-slate-900">{customer?.name || order.name}</p>
            {customer?.phone && (
              <p className="mt-1 text-slate-700">
                <strong>Phone:</strong> {customer.phone}
              </p>
            )}
            <p className="mt-1 text-slate-700">
              <strong>Site Address:</strong> {customer?.address || 'Site address confirmed on order file'}
            </p>
          </div>

          {/* Box 2: Fabrication Timelines & Agreed Total */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Production Dates / समय सारणी
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block">Job Created:</span>
                <span className="font-semibold text-slate-800">{dateTime(order.created_at)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Promised Due Date:</span>
                <span className="font-semibold text-orange-600">
                  {order.due_at ? dateTime(order.due_at) : 'Priority standard (7-10 days)'}
                </span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-200/60 mt-1 flex justify-between items-center">
                <span className="text-slate-500">Order Agreed Value:</span>
                <span className="font-bold text-slate-900 text-sm">{money(order.total_minor)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Job Specifications Table */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Fabrication Scope &amp; Specifications / सामान व नाप का विवरण
            </h2>
            <span className="text-[11px] text-slate-500">{snapshotItems.length} specification item(s)</span>
          </div>

          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-3 w-12 text-center">#</th>
                <th className="p-3">Job Description &amp; Technical Specs</th>
                <th className="p-3 w-24 text-right">Quantity</th>
                <th className="p-3 w-32 text-right">Unit Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {snapshotItems.length > 0 ? (
                snapshotItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{item.description}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        High-strength welds, deburred edges, primer base coated.
                      </p>
                    </td>
                    <td className="p-3 text-right font-semibold text-slate-800">{item.quantity}</td>
                    <td className="p-3 text-right font-mono text-slate-700">{money(item.unit_minor)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3 text-center text-slate-400 font-mono">1</td>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{order.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Custom fabricated gate/railing as per approved quotation and client drawings.
                    </p>
                  </td>
                  <td className="p-3 text-right font-semibold text-slate-800">1 Job</td>
                  <td className="p-3 text-right font-mono text-slate-700">{money(order.total_minor)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* 8-Step Workshop Checklist with QR Code Sidebar */}
        <section className="mt-6 grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-6 items-start">
          {/* Checklist */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
              <CheckSquare size={14} className="text-orange-600" />
              <span>Fabricator Floor Checklist / कारीगर चेकलिस्ट (Sign-off)</span>
            </h2>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white overflow-hidden text-xs">
              {stages.map(s => (
                <div key={s.num} className="p-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-4 w-4 rounded-sm border-2 border-slate-400 grid place-items-center text-white shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900 leading-tight">
                        {s.num}. {s.hi} <span className="text-[10px] text-slate-500 font-normal">({s.en})</span>
                      </p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 shrink-0 border-b border-dashed border-slate-300 w-16 text-center">
                    Sign: ____
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QR Code Scan Panel */}
          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/80 p-4 text-center flex flex-col items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Live Order QR Code
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Scan with camera to inspect CAD drawings &amp; update live stage
            </p>

            {/* QR Code Image */}
            <div className="my-3 rounded-lg border border-slate-200 bg-white p-2 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt={`QR code for order ${orderCode}`}
                className="h-40 w-40 object-contain mx-auto"
              />
            </div>

            <p className="font-mono text-[11px] font-bold text-slate-800">{orderCode}</p>
            <p className="text-[9px] text-slate-400 mt-1 break-all">{trackingUrl}</p>

            <div className="mt-4 w-full rounded-lg bg-orange-100/70 p-2 text-left text-[10px] text-orange-900">
              <p className="font-bold flex items-center gap-1">
                <ShieldCheck size={12} className="text-orange-700" />
                Workshop Security Note:
              </p>
              <p className="mt-0.5 leading-relaxed">
                Do not release fabrication from workshop without supervisor sign-off and QC clearance stamp.
              </p>
            </div>
          </div>
        </section>

        {/* Signatures & Approvals Block */}
        <footer className="mt-8 pt-5 border-t-2 border-slate-200 grid grid-cols-3 gap-6 text-xs text-center">
          <div>
            <div className="border-b border-slate-400 pb-12 mb-1.5" />
            <p className="font-bold text-slate-800">Lead Welder / Fabricator</p>
            <p className="text-[10px] text-slate-400">कारीगर का नाम व हस्ताक्षर</p>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-12 mb-1.5" />
            <p className="font-bold text-slate-800">Quality Inspector (QC)</p>
            <p className="text-[10px] text-slate-400">क्वालिटी जांच व पास</p>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-12 mb-1.5" />
            <p className="font-bold text-slate-800">Workshop Supervisor</p>
            <p className="text-[10px] text-slate-400">वर्कशॉप मैनेजर स्वीकृति</p>
          </div>
        </footer>
      </article>

      {/* Inline print script to trigger window.print() on button click */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.querySelector('[data-action="print"]')?.addEventListener('click', function() {
              window.print();
            });
          `
        }}
      />
    </div>
  );
}
