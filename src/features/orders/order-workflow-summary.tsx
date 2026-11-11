'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Truck, Wrench, CreditCard, AlertCircle } from 'lucide-react';

interface WorkflowSummaryProps {
  order: Record<string, unknown>;
}

export function OrderWorkflowSummary({ order }: WorkflowSummaryProps) {
  const orderId = String(order.id);
  const [paymentData, setPaymentData] = useState<{
    totalMinor: number;
    totalPaidMinor: number;
    balanceDueMinor: number;
    isPaidAllDone: boolean;
  } | null>(null);

  const [deliveryData, setDeliveryData] = useState<{
    status: string;
    confirmed_at?: string | null;
    delivered_by?: string | null;
    customer_signature?: string | null;
  } | null>(null);

  const [installationData, setInstallationData] = useState<{
    status: string;
    customer_confirmed: boolean;
    installed_by?: string | null;
    customer_signature?: string | null;
    completed_at?: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Load payment data
    void fetch(`/api/v1/orders/${orderId}/advance-payment`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.data) {
          setPaymentData({
            totalMinor: json.data.totalMinor,
            totalPaidMinor: json.data.totalPaidMinor,
            balanceDueMinor: json.data.balanceDueMinor,
            isPaidAllDone: Boolean(json.data.isPaidAllDone),
          });
        }
      })
      .catch(() => {});

    // Load delivery data
    void fetch(`/api/v1/admin/deliveries?context=orders&context_id=${orderId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.data) {
          const list = Array.isArray(json.data) ? json.data : json.data.items || [];
          const match = list.find((d: { order_id?: string }) => d.order_id === orderId) || list[0];
          if (match) {
            setDeliveryData({
              status: match.status,
              confirmed_at: match.confirmed_at,
              delivered_by: match.delivered_by || match.crew,
              customer_signature: match.customer_signature,
            });
          }
        }
      })
      .catch(() => {});

    // Load installation data
    void fetch(`/api/v1/orders/${orderId}/installation`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.data) {
          setInstallationData({
            status: json.data.status,
            customer_confirmed: Boolean(json.data.customer_confirmed),
            installed_by: json.data.installed_by,
            customer_signature: json.data.customer_signature,
            completed_at: json.data.completed_at,
          });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const totalRupees = paymentData ? paymentData.totalMinor / 100 : Number(order.total_minor || 0) / 100;
  const paidRupees = paymentData ? paymentData.totalPaidMinor / 100 : 0;
  const balanceRupees = paymentData ? paymentData.balanceDueMinor / 100 : totalRupees;
  const is100Paid = paymentData?.isPaidAllDone || balanceRupees === 0;

  const isDeliveryCompleted =
    deliveryData?.status === 'delivered' && Boolean(deliveryData.confirmed_at);

  const isInstallationCompleted =
    installationData?.status === 'completed' && Boolean(installationData.customer_confirmed);

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Order Completion Requirements &amp; Sign-offs (ऑर्डर पूर्णता एवं साइन-ऑफ स्थिति)
          </h4>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Order completion strictly requires 100% payment, Delivery Sign-off, and Installation Sign-off.
          </p>
        </div>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-mono font-bold text-slate-700">
          Stage: {String(order.status || 'CONFIRMED')}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Requirement 1: 100% Payment */}
        <div
          className={`rounded-lg border p-3 text-xs transition-colors ${
            is100Paid
              ? 'border-emerald-200 bg-emerald-50/60'
              : paidRupees > 0
              ? 'border-amber-200 bg-amber-50/60'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <CreditCard size={14} className={is100Paid ? 'text-emerald-700' : 'text-amber-700'} />
              1. Payment (100%)
            </span>
            {is100Paid ? (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                <CheckCircle2 size={11} /> COMPLETED
              </span>
            ) : paidRupees > 0 ? (
              <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                <Clock size={11} /> PARTIAL
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                PENDING
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-700">
            {is100Paid ? (
              <span className="font-semibold text-emerald-800">
                100% Paid (₹{paidRupees.toLocaleString('en-IN')}) · Balance: ₹0
              </span>
            ) : (
              <span>
                Paid: ₹{paidRupees.toLocaleString('en-IN')} · <strong className="text-amber-900">Remaining: ₹{balanceRupees.toLocaleString('en-IN')}</strong>
              </span>
            )}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            {is100Paid ? 'Cleared for dispatch' : '100% payment required before dispatch'}
          </p>
        </div>

        {/* Requirement 2: Delivery Sign-off */}
        <div
          className={`rounded-lg border p-3 text-xs transition-colors ${
            isDeliveryCompleted
              ? 'border-emerald-200 bg-emerald-50/60'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Truck size={14} className={isDeliveryCompleted ? 'text-emerald-700' : 'text-slate-500'} />
              2. Delivery Sign-off
            </span>
            {isDeliveryCompleted ? (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                <CheckCircle2 size={11} /> COMPLETED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                PENDING
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-700">
            {isDeliveryCompleted ? (
              <span className="font-semibold text-emerald-800">
                Delivered by {deliveryData.delivered_by || 'Crew'}
              </span>
            ) : (
              <span className="text-slate-600">Site delivery pending sign-off</span>
            )}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            {isDeliveryCompleted
              ? `Confirmed: ${deliveryData.customer_signature || 'Yes'}`
              : 'Record sign-off in Deliveries'}
          </p>
        </div>

        {/* Requirement 3: Installation Sign-off */}
        <div
          className={`rounded-lg border p-3 text-xs transition-colors ${
            isInstallationCompleted
              ? 'border-emerald-200 bg-emerald-50/60'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Wrench size={14} className={isInstallationCompleted ? 'text-emerald-700' : 'text-slate-500'} />
              3. Installation Sign-off
            </span>
            {isInstallationCompleted ? (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                <CheckCircle2 size={11} /> COMPLETED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                PENDING
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-700">
            {isInstallationCompleted ? (
              <span className="font-semibold text-emerald-800">
                Installed by {installationData.installed_by || 'Team'}
              </span>
            ) : (
              <span className="text-slate-600">Fitting pending sign-off below</span>
            )}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            {isInstallationCompleted
              ? `Customer confirmed: ${installationData.customer_signature || 'Yes'}`
              : 'Sign off below in Installation section'}
          </p>
        </div>
      </div>
    </div>
  );
}

