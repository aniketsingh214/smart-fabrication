import { notFound, redirect } from 'next/navigation';
import { serverClient } from '@/lib/supabase/server';
import { PublicHeader } from '@/components/layout/public-header';
import { dateTime, money } from '@/lib/utils';
import { getServerLocale } from '@/lib/i18n/server';
import { getMilestoneInfo } from '@/lib/i18n/order-milestones';
import { CheckCircle2, Circle, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function Timeline({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getServerLocale();
  const db = await serverClient();
  const {
    data: { user }
  } = await db.auth.getUser();
  if (!user) redirect('/login');
  const { data: owned } = await db.rpc('my_orders', { target: id });
  const order = owned?.[0];
  if (!order) notFound();
  const { data: history, error } = await db.rpc('customer_order_timeline', { target: id });

  const currentMilestone = getMilestoneInfo(order.status, locale);

  const stages = [
    { num: 1, hi: 'ऑर्डर मिल गया', en: 'Order Placed' },
    { num: 2, hi: 'नाप की जाँच', en: 'Measurement' },
    { num: 3, hi: 'काम शुरू हो गया', en: 'Fabrication' },
    { num: 4, hi: 'सामान तैयार है', en: 'Ready' },
    { num: 5, hi: 'डिलीवरी निकली', en: 'Out for Delivery' },
    { num: 6, hi: 'सामान पहुँचा', en: 'On-Site' },
    { num: 7, hi: 'काम पूरा हो गया', en: 'Completed' }
  ];

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <Link href="/account" className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700">
          <ArrowLeft size={14} />
          <span>{locale === 'hi' ? '← My account / मेरे प्रोजेक्ट्स' : '← My account'}</span>
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${currentMilestone.colorClass}`}>
                {currentMilestone.stageName}
              </span>
              <span className="text-xs text-slate-400">Order ID: {order.id.slice(0, 8)}</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{order.name}</h1>
            <p className="mt-2 text-xl font-bold text-orange-600">{money(order.total_minor)}</p>
          </div>
        </div>

        {/* Current Status Banner */}
        <div className="mt-8 rounded-2xl border border-orange-200/80 bg-orange-50/50 p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-800">
            {locale === 'hi' ? 'ताज़ा स्थिति (Current Status)' : 'Current Status'}
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">{currentMilestone.label}</p>
          {currentMilestone.description && (
            <p className="mt-1 text-xs text-slate-600">{currentMilestone.description}</p>
          )}
        </div>

        {/* 7-Stage Visual Stepper */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            {locale === 'hi' ? 'काम के 7 चरण (7 Fabrication Stages)' : 'Fabrication Stages'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {stages.map(s => {
              const isPast = currentMilestone.stageNumber > s.num;
              const isCurrent = currentMilestone.stageNumber === s.num;
              return (
                <div
                  key={s.num}
                  className={`flex flex-col items-center rounded-xl p-2.5 text-center transition ${
                    isCurrent
                      ? 'border-2 border-orange-500 bg-orange-50/80'
                      : isPast
                        ? 'border border-emerald-200 bg-emerald-50/40 text-emerald-800'
                        : 'border border-slate-100 bg-slate-50/50 opacity-60'
                  }`}
                >
                  <div
                    className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                      isCurrent
                        ? 'bg-orange-600 text-white'
                        : isPast
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isPast ? '✓' : s.num}
                  </div>
                  <span className="mt-1.5 text-[11px] font-semibold leading-tight text-slate-800">
                    {locale === 'hi' ? s.hi : s.en}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Complete Timeline Events */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-6">
            {locale === 'hi' ? 'प्रोजेक्ट टाइमलाइन (Project timeline)' : 'Project timeline'}
          </h2>
          {error ? (
            <p className="mt-2 text-sm text-red-600">Timeline could not be loaded.</p>
          ) : (
            <ol className="space-y-6 border-l-2 border-orange-200 pl-6 ml-2">
              {history?.map((h: { id: string; to_status: string; created_at: string }) => {
                const info = getMilestoneInfo(h.to_status, locale);
                return (
                  <li key={h.id} className="relative">
                    <span className="absolute -left-[31px] top-1 grid h-4 w-4 place-items-center rounded-full bg-orange-600 ring-4 ring-orange-100" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {info.label} <span className="text-xs font-normal text-slate-400">({h.to_status.replaceAll('_', ' ')})</span>
                      </p>
                      {info.description && (
                        <p className="mt-0.5 text-xs text-slate-600">{info.description}</p>
                      )}
                      <p className="mt-1.5 text-[11px] text-slate-400">{dateTime(h.created_at)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </main>
    </>
  );
}

