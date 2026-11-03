import {recordLabel} from '@/contracts/record-identity';
import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import { customerOrders, customerQuotations } from '@/features/operations/services';
import { QuoteResponse } from '@/features/quotations/quote-response';
import { money,dateTime } from '@/lib/utils';
import { getMilestoneInfo } from '@/lib/i18n/order-milestones';

export type AccountFilters = { qcursor?: string; ocursor?: string; quotation?: string };

export async function AccountProjects({ db, filters }: { db: SupabaseClient; filters: AccountFilters }) {
  // This async server component evaluates expiry once for the current request.
  // eslint-disable-next-line react-hooks/purity -- Request-time server clock; never a client render clock.
  const evaluatedAt=Date.now();
  const quoteParams = new URLSearchParams(filters.qcursor && !filters.quotation ? { cursor: filters.qcursor } : {});
  const orderParams = new URLSearchParams(filters.ocursor ? { cursor: filters.ocursor } : {});
  const [quotes, orders] = await Promise.allSettled([
    customerQuotations(db, quoteParams, filters.quotation),
    customerOrders(db, orderParams)
  ]);

  const href = (kind: 'quotes' | 'orders', cursor?: string) => {
    const params = new URLSearchParams();
    if (filters.qcursor) params.set('qcursor', filters.qcursor);
    if (filters.ocursor) params.set('ocursor', filters.ocursor);
    if (filters.quotation) params.set('quotation', filters.quotation);
    const key = kind === 'quotes' ? 'qcursor' : 'ocursor';
    if (kind === 'quotes') params.delete('quotation');
    if (cursor) params.set(key, cursor);
    else params.delete(key);
    return '/account' + (params.size ? '?' + params.toString() : '');
  };

  return (
    <>
    <section aria-label="Project overview" className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold">Your project overview / आपका प्रोजेक्ट</h2>
      <p className="mt-2 text-xs text-slate-500">Counts cover the currently displayed pages. Order values are agreed totals, not outstanding payment balances.</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div><dt className="text-xs text-slate-500">Quotations on this page</dt><dd className="mt-1 text-xl font-bold">{quotes.status==='fulfilled'?quotes.value.items.length:'Unavailable'}</dd></div>
        <div><dt className="text-xs text-slate-500">Awaiting your decision</dt><dd className="mt-1 text-xl font-bold">{quotes.status==='fulfilled'?quotes.value.items.filter(q=>q.status==='approved'&&new Date(String(q.expires_at)).getTime()>evaluatedAt).length:'Unavailable'}</dd></div>
        <div><dt className="text-xs text-slate-500">Orders on this page</dt><dd className="mt-1 text-xl font-bold">{orders.status==='fulfilled'?orders.value.items.length:'Unavailable'}</dd></div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-orange-700"><Link href="/contact?measurement=1">Request a site measurement</Link><Link href="/catalog">Explore designs</Link></div>
    </section>
    <div className="grid gap-6 md:grid-cols-2">
      <section className="card min-w-0 p-6">
        <h2 className="mb-5 text-lg font-bold">
          कोटेशन सूची <span className="text-xs font-normal text-slate-400 block sm:inline">(Your quotations)</span>
        </h2>
        {quotes.status === 'rejected' ? (
          <p role="alert" className="text-sm text-red-600">
            Quotations could not be loaded. Check the page link or return to the first page.
          </p>
        ) : !quotes.value.items.length ? (
          <p className="text-sm text-slate-500">
            No approved quotations linked to your account on this page. / आपके खाते से जुड़ा कोई कोटेशन नहीं मिला।
          </p>
        ) : (
          quotes.value.items.map(q => (
            <article id={`quotation-${q.id}`} key={String(q.id)} className="mb-4 border-b border-slate-100 pb-4">
              <h3 className="text-sm font-semibold">{recordLabel(q,'Quotation')}</h3>
              <p className="my-3 text-xs text-slate-500">{String(q.status)}</p>
              <p className="mb-3 text-xs text-slate-500">Valid until {dateTime(String(q.expires_at))} (India time)</p>
              {q.status==='approved'&&new Date(String(q.expires_at)).getTime()<=evaluatedAt?<p className="text-xs text-orange-800">This quotation has expired. Contact the workshop for a revision.</p>:<QuoteResponse id={String(q.id)} status={String(q.status)} />}
              <a
                className="mt-3 inline-block text-xs font-semibold text-orange-600 hover:text-orange-700"
                target="_blank"
                rel="noopener noreferrer"
                href={`/api/v1/quotations/${q.id}/pdf`}
              >
                View quotation PDF / कोटेशन पीडीएफ देखें
              </a>
            </article>
          ))
        )}
        <nav aria-label="Quotation pages" className="mt-5 flex flex-wrap gap-4 text-xs font-semibold text-orange-700">
          {(filters.qcursor || filters.quotation || quotes.status === 'rejected') && (
            <Link href={href('quotes')}>First quotation page / पहला पेज</Link>
          )}
          {quotes.status === 'fulfilled' && quotes.value.nextCursor && (
            <Link href={href('quotes', quotes.value.nextCursor)}>Older quotations →</Link>
          )}
        </nav>
      </section>

      <section className="card min-w-0 p-6">
        <h2 className="mb-5 text-lg font-bold">
          ऑर्डर सूची <span className="text-xs font-normal text-slate-400 block sm:inline">(Your orders)</span>
        </h2>
        {orders.status === 'rejected' ? (
          <p role="alert" className="text-sm text-red-600">
            Orders could not be loaded. Check the page link or return to the first page.
          </p>
        ) : !orders.value.items.length ? (
          <p className="text-sm text-slate-500">
            Your accepted projects will appear here. / आपके स्वीकृत प्रोजेक्ट यहाँ दिखाई देंगे।
          </p>
        ) : (
          orders.value.items.map(order => {
            const milestone = getMilestoneInfo(String(order.status));
            return (
              <article key={String(order.id)} className="mb-4 border-b border-slate-100 pb-4">
                <h3 className="text-sm font-semibold">{recordLabel(order,'Order')}</h3>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className={`status ${milestone.colorClass}`}>
                    {milestone.label} ({String(order.status).replaceAll('_', ' ')})
                  </span>
                  <span className="text-sm font-bold text-slate-900">{money(Number(order.total_minor))}</span>
                </div>
                <Link
                  className="mt-3 inline-block text-xs font-semibold text-orange-600 hover:text-orange-700"
                  href={`/account/orders/${order.id}`}
                >
                  View order timeline → / काम की स्थिति देखें
                </Link>
              </article>
            );
          })
        )}
        <nav aria-label="Order pages" className="mt-5 flex flex-wrap gap-4 text-xs font-semibold text-orange-700">
          {(filters.ocursor || orders.status === 'rejected') && (
            <Link href={href('orders')}>First order page / पहला पेज</Link>
          )}
          {orders.status === 'fulfilled' && orders.value.nextCursor && (
            <Link href={href('orders', orders.value.nextCursor)}>Older orders →</Link>
          )}
        </nav>
      </section>
    </div>
    </>
  );
}

