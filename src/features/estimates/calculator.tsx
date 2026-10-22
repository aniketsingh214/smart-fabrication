'use client';
import { ReferenceInput } from '@/features/operations/reference-input';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { Ruler, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { money } from '@/lib/utils';
import type { Estimate } from '@/contracts/estimates';

type UnitType = 'mm' | 'ft_in' | 'ft' | 'in' | 'm';

export function Calculator({ products, selected }: { products: { id: string; name: string }[]; selected?: string }) {
  const submitting = useRef(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState(selected ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Estimate | null>(null);

  // Unit system selection: mm, ft_in, ft, in, m
  const [unit, setUnit] = useState<UnitType>('mm');

  // Input states
  const [widthMm, setWidthMm] = useState('1000');
  const [heightMm, setHeightMm] = useState('2000');

  // Feet & Inches
  const [widthFt, setWidthFt] = useState('10');
  const [widthIn, setWidthIn] = useState('0');
  const [heightFt, setHeightFt] = useState('6');
  const [heightIn, setHeightIn] = useState('0');

  // Decimal Feet, Inches, Meters
  const [widthDecimal, setWidthDecimal] = useState('10');
  const [heightDecimal, setHeightDecimal] = useState('6');

  // Compute effective mm
  let effectiveWidthMm = 0;
  let effectiveHeightMm = 0;

  if (unit === 'mm') {
    effectiveWidthMm = Math.round(Number(widthMm) || 0);
    effectiveHeightMm = Math.round(Number(heightMm) || 0);
  } else if (unit === 'ft_in') {
    effectiveWidthMm = Math.round(((Number(widthFt) || 0) * 12 + (Number(widthIn) || 0)) * 25.4);
    effectiveHeightMm = Math.round(((Number(heightFt) || 0) * 12 + (Number(heightIn) || 0)) * 25.4);
  } else if (unit === 'ft') {
    effectiveWidthMm = Math.round((Number(widthDecimal) || 0) * 304.8);
    effectiveHeightMm = Math.round((Number(heightDecimal) || 0) * 304.8);
  } else if (unit === 'in') {
    effectiveWidthMm = Math.round((Number(widthDecimal) || 0) * 25.4);
    effectiveHeightMm = Math.round((Number(heightDecimal) || 0) * 25.4);
  } else if (unit === 'm') {
    effectiveWidthMm = Math.round((Number(widthDecimal) || 0) * 1000);
    effectiveHeightMm = Math.round((Number(heightDecimal) || 0) * 1000);
  }

  // Sq feet & Sq metres calculation
  const areaSqFt = effectiveWidthMm > 0 && effectiveHeightMm > 0
    ? ((effectiveWidthMm * effectiveHeightMm) / 92903.04).toFixed(1)
    : '0';
  const areaSqM = effectiveWidthMm > 0 && effectiveHeightMm > 0
    ? ((effectiveWidthMm * effectiveHeightMm) / 1000000).toFixed(2)
    : '0';

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="card space-y-5 p-6"
        onSubmit={async event => {
          event.preventDefault();
          if (submitting.current) return;
          submitting.current = true;
          setBusy(true);
          setError('');
          setResult(null);

          try {
            const r = await fetch('/api/v1/estimates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                product_id: selectedProduct,
                width_mm: effectiveWidthMm,
                height_mm: effectiveHeightMm
              })
            });
            const body = await r.json();
            if (!r.ok) throw new Error(body.error?.message ?? 'Estimate unavailable');
            setResult(body.data);
            setDimensions({ width: effectiveWidthMm, height: effectiveHeightMm });
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Estimate unavailable');
          } finally {
            submitting.current = false;
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={busy} className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold">Project dimensions</h2>
            {/* Unit Selector Toggle */}
            <div className="flex items-center rounded-lg bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setUnit('mm')}
                className={`rounded-md px-2.5 py-1 transition ${unit === 'mm' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                mm
              </button>
              <button
                type="button"
                onClick={() => setUnit('ft_in')}
                className={`rounded-md px-2.5 py-1 transition ${unit === 'ft_in' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Feet + Inch
              </button>
              <button
                type="button"
                onClick={() => setUnit('ft')}
                className={`rounded-md px-2.5 py-1 transition ${unit === 'ft' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Feet
              </button>
              <button
                type="button"
                onClick={() => setUnit('in')}
                className={`rounded-md px-2.5 py-1 transition ${unit === 'in' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Inch
              </button>
              <button
                type="button"
                onClick={() => setUnit('m')}
                className={`rounded-md px-2.5 py-1 transition ${unit === 'm' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Meter
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="product_id" className="mb-2 block">
              Design
            </label>
            <ReferenceInput
              field={{ key: 'product_id', label: 'Design', type: 'reference', reference: 'products', required: true }}
              initial={selected}
              initialOptions={products}
              publicList
              onSelectionChange={value => {
                setSelectedProduct(value);
                setResult(null);
              }}
            />
          </div>

          {/* Unit Specific Inputs */}
          {unit === 'mm' && (
            <div className="grid grid-cols-2 gap-4">
              <label>
                Width (mm)
                <input
                  className="mt-2"
                  type="number"
                  name="width_mm"
                  id="width_mm"
                  min={100}
                  max={20000}
                  required
                  value={widthMm}
                  onChange={e => setWidthMm(e.target.value)}
                  placeholder="e.g. 3000"
                />
              </label>
              <label>
                Height (mm)
                <input
                  className="mt-2"
                  type="number"
                  name="height_mm"
                  id="height_mm"
                  min={100}
                  max={10000}
                  required
                  value={heightMm}
                  onChange={e => setHeightMm(e.target.value)}
                  placeholder="e.g. 1800"
                />
              </label>
            </div>
          )}

          {unit === 'ft_in' && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-700">Width (चौड़ाई)</span>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <label className="text-xs text-slate-500">
                    Feet (ft)
                    <input
                      type="number"
                      min={0}
                      max={65}
                      required
                      value={widthFt}
                      onChange={e => setWidthFt(e.target.value)}
                      className="mt-1"
                      placeholder="e.g. 10"
                    />
                  </label>
                  <label className="text-xs text-slate-500">
                    Inches (in)
                    <input
                      type="number"
                      min={0}
                      max={11.9}
                      step="any"
                      required
                      value={widthIn}
                      onChange={e => setWidthIn(e.target.value)}
                      className="mt-1"
                      placeholder="e.g. 6"
                    />
                  </label>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-700">Height (ऊंचाई)</span>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <label className="text-xs text-slate-500">
                    Feet (ft)
                    <input
                      type="number"
                      min={0}
                      max={33}
                      required
                      value={heightFt}
                      onChange={e => setHeightFt(e.target.value)}
                      className="mt-1"
                      placeholder="e.g. 6"
                    />
                  </label>
                  <label className="text-xs text-slate-500">
                    Inches (in)
                    <input
                      type="number"
                      min={0}
                      max={11.9}
                      step="any"
                      required
                      value={heightIn}
                      onChange={e => setHeightIn(e.target.value)}
                      className="mt-1"
                      placeholder="e.g. 0"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {['ft', 'in', 'm'].includes(unit) && (
            <div className="grid grid-cols-2 gap-4">
              <label>
                Width ({unit === 'ft' ? 'Feet' : unit === 'in' ? 'Inches' : 'Meters'})
                <input
                  className="mt-2"
                  type="number"
                  step="any"
                  min={0.1}
                  required
                  value={widthDecimal}
                  onChange={e => setWidthDecimal(e.target.value)}
                  placeholder={unit === 'ft' ? 'e.g. 10' : unit === 'in' ? 'e.g. 120' : 'e.g. 3.0'}
                />
              </label>
              <label>
                Height ({unit === 'ft' ? 'Feet' : unit === 'in' ? 'Inches' : 'Meters'})
                <input
                  className="mt-2"
                  type="number"
                  step="any"
                  min={0.1}
                  required
                  value={heightDecimal}
                  onChange={e => setHeightDecimal(e.target.value)}
                  placeholder={unit === 'ft' ? 'e.g. 6' : unit === 'in' ? 'e.g. 72' : 'e.g. 1.8'}
                />
              </label>
            </div>
          )}

          {/* Real-time multi-unit conversion indicator */}
          {effectiveWidthMm > 0 && effectiveHeightMm > 0 && (
            <div className="rounded-xl border border-orange-200/80 bg-orange-50/60 p-3.5 text-xs text-slate-700 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold text-orange-800">
                <Ruler size={14} className="text-orange-600" />
                <span>Equivalent Dimensions & Area</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-md bg-white/90 p-2 border border-orange-100">
                  <span className="text-slate-400 block">Metric (mm / m):</span>
                  <strong className="text-slate-900 font-semibold">{effectiveWidthMm.toLocaleString()} mm × {effectiveHeightMm.toLocaleString()} mm</strong>
                  <span className="text-slate-500 block mt-0.5">({(effectiveWidthMm / 1000).toFixed(2)} m × {(effectiveHeightMm / 1000).toFixed(2)} m)</span>
                </div>
                <div className="rounded-md bg-white/90 p-2 border border-orange-100">
                  <span className="text-slate-400 block">Imperial (Feet & Inches):</span>
                  <strong className="text-slate-900 font-semibold">
                    {Math.floor(effectiveWidthMm / 304.8)} ft {Math.round((effectiveWidthMm % 304.8) / 25.4)} in × {Math.floor(effectiveHeightMm / 304.8)} ft {Math.round((effectiveHeightMm % 304.8) / 25.4)} in
                  </strong>
                  <span className="text-slate-500 block mt-0.5">Area: <strong>{areaSqFt} sq. ft.</strong> ({areaSqM} m²)</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs leading-6 text-slate-400">
            Dimensions are converted to workshop millimetres. Published workshop material and pricing rules determine this estimate.
          </p>

          {error && (
            <p role="alert" className="rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
              {error}
            </p>
          )}

          <Button disabled={busy || !selectedProduct}>
            {busy ? 'Calculating…' : 'Calculate approximate price'}
            <ArrowRight size={15} />
          </Button>
        </fieldset>
      </form>

      <section className="card p-6" aria-live="polite">
        {result ? (
          <>
            <div className="eyebrow text-orange-600">Approximate estimate</div>
            <div className="mt-4 text-3xl font-bold">
              {money(result.min_minor)} – {money(result.max_minor)}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {result.area_sq_m} m² · Approximate material weight {result.weight_kg} kg
            </p>
            <div className="mt-6 overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Quantity</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {result.materials.map((m, i) => (
                    <tr key={i}>
                      <td>{m.name}</td>
                      <td>
                        {m.quantity} {m.unit}
                      </td>
                      <td>{money(m.amount_minor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!result.materials.length && (
              <p className="mt-3 text-sm text-slate-500">Material details will be confirmed in the quotation.</p>
            )}
            <p className="mt-5 rounded-lg bg-orange-50 p-3 text-xs leading-6 text-orange-800">{result.notice}</p>
            <Button asChild className="mt-5">
              <Link
                href={
                  '/contact?product=' +
                  encodeURIComponent(selectedProduct) +
                  (dimensions ? '&width_mm=' + dimensions.width + '&height_mm=' + dimensions.height : '')
                }
              >
                Request exact quotation
              </Link>
            </Button>
          </>
        ) : (
          <div className="grid h-full min-h-72 place-content-center text-center">
            <Ruler className="mx-auto mb-4 text-slate-300" size={36} />
            <h2 className="text-lg font-bold">Plan before you build</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">
              Select your preferred unit (mm, Feet + Inch, Feet, Inch, or Meter) and enter dimensions for an approximate estimate.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
