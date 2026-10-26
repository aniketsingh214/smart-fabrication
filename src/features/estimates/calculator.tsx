'use client';
import { SnapshotTable } from '@/components/snapshot-table';
import { ReferenceInput } from '@/features/operations/reference-input';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { Ruler, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { money } from '@/lib/utils';
import { useLocale } from '@/lib/i18n/locale-context';
import type { Estimate } from '@/contracts/estimates';

type UnitType = 'ft_in' | 'mm' | 'ft' | 'in' | 'm';

export function Calculator({ products, selected }: { products: { id: string; name: string }[]; selected?: string }) {
  const { locale, dict } = useLocale();
  const submitting = useRef(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState(selected ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Estimate | null>(null);

  // Unit system selection: default to 'ft_in' for rural homeowners and small-town customers
  const [unit, setUnit] = useState<UnitType>('ft_in');

  // Input states - initialized to standard 10ft x 6ft (approx 3048mm x 1829mm)
  const [widthFt, setWidthFt] = useState('10');
  const [widthIn, setWidthIn] = useState('0');
  const [heightFt, setHeightFt] = useState('6');
  const [heightIn, setHeightIn] = useState('0');

  const [widthMm, setWidthMm] = useState('3048');
  const [heightMm, setHeightMm] = useState('1829');

  // Decimal Feet, Inches, Meters
  const [widthDecimal, setWidthDecimal] = useState('10');
  const [heightDecimal, setHeightDecimal] = useState('6');

  // Synchronize from Ft/In to mm
  const syncFromFtIn = (wFt: string, wIn: string, hFt: string, hIn: string) => {
    const calcWidthMm = Math.round(((Number(wFt) || 0) * 12 + (Number(wIn) || 0)) * 25.4);
    const calcHeightMm = Math.round(((Number(hFt) || 0) * 12 + (Number(hIn) || 0)) * 25.4);
    setWidthMm(String(calcWidthMm));
    setHeightMm(String(calcHeightMm));
    setWidthDecimal(((Number(wFt) || 0) + (Number(wIn) || 0) / 12).toFixed(1));
    setHeightDecimal(((Number(hFt) || 0) + (Number(hIn) || 0) / 12).toFixed(1));
  };

  // Synchronize from mm to Ft/In
  const syncFromMm = (wMm: string, hMm: string) => {
    const mmW = Number(wMm) || 0;
    const mmH = Number(hMm) || 0;
    const totalWInches = mmW / 25.4;
    const totalHInches = mmH / 25.4;
    setWidthFt(String(Math.floor(totalWInches / 12)));
    setWidthIn(String(Math.round(totalWInches % 12)));
    setHeightFt(String(Math.floor(totalHInches / 12)));
    setHeightIn(String(Math.round(totalHInches % 12)));
    setWidthDecimal((mmW / 304.8).toFixed(1));
    setHeightDecimal((mmH / 304.8).toFixed(1));
  };

  // Compute effective mm
  let effectiveWidthMm = 0;
  let effectiveHeightMm = 0;

  if (unit === 'ft_in') {
    effectiveWidthMm = Math.round(((Number(widthFt) || 0) * 12 + (Number(widthIn) || 0)) * 25.4);
    effectiveHeightMm = Math.round(((Number(heightFt) || 0) * 12 + (Number(heightIn) || 0)) * 25.4);
  } else if (unit === 'mm') {
    effectiveWidthMm = Math.round(Number(widthMm) || 0);
    effectiveHeightMm = Math.round(Number(heightMm) || 0);
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
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {locale === 'hi' ? 'नाप और डिज़ाइन' : 'Project dimensions'}
              </h2>
              <p className="text-xs text-slate-500">
                {locale === 'hi' ? 'अपनी सुविधा अनुसार नापने की इकाई चुनें' : 'Choose your preferred measurement unit'}
              </p>
            </div>
            {/* Unit Selector Toggle */}
            <div className="flex flex-wrap items-center rounded-lg bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setUnit('ft_in')}
                className={`rounded-md px-2.5 py-1 transition ${unit === 'ft_in' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Feet + Inch
              </button>
              <button
                type="button"
                onClick={() => setUnit('mm')}
                className={`rounded-md px-2.5 py-1 transition ${unit === 'mm' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                mm
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
            <label htmlFor="product_id" className="mb-2 block font-medium text-slate-800">
              {locale === 'hi' ? 'गेट या रेलिंग का डिज़ाइन चुनें (Design)' : 'Design'}
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

          {/* Feet & Inches Primary Inputs (Rural Friendly Default) */}
          {unit === 'ft_in' && (
            <div className="space-y-4 rounded-xl border border-orange-100 bg-orange-50/30 p-4">
              <div>
                <span className="text-sm font-semibold text-slate-900">
                  {locale === 'hi' ? '1. गेट की चौड़ाई कितनी है? (Width)' : 'Width (चौड़ाई)'}
                </span>
                <p className="text-[11px] text-slate-500 mb-2">
                  {locale === 'hi' ? 'उदाहरण: 10 फीट 6 इंच' : 'e.g. 10 feet 6 inches'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-medium text-slate-600">
                    {dict.calculator.feet} (ft)
                    <input
                      type="number"
                      min={0}
                      max={65}
                      required
                      value={widthFt}
                      onChange={e => {
                        const val = e.target.value;
                        setWidthFt(val);
                        syncFromFtIn(val, widthIn, heightFt, heightIn);
                      }}
                      className="mt-1"
                      placeholder="10"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    {dict.calculator.inches} (in)
                    <input
                      type="number"
                      min={0}
                      max={11.9}
                      step="any"
                      required
                      value={widthIn}
                      onChange={e => {
                        const val = e.target.value;
                        setWidthIn(val);
                        syncFromFtIn(widthFt, val, heightFt, heightIn);
                      }}
                      className="mt-1"
                      placeholder="0"
                    />
                  </label>
                </div>
              </div>

              <div>
                <span className="text-sm font-semibold text-slate-900">
                  {locale === 'hi' ? '2. गेट की ऊँचाई कितनी है? (Height)' : 'Height (ऊंचाई)'}
                </span>
                <p className="text-[11px] text-slate-500 mb-2">
                  {locale === 'hi' ? 'उदाहरण: 6 फीट 0 इंच' : 'e.g. 6 feet 0 inches'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-medium text-slate-600">
                    {dict.calculator.feet} (ft)
                    <input
                      type="number"
                      min={0}
                      max={33}
                      required
                      value={heightFt}
                      onChange={e => {
                        const val = e.target.value;
                        setHeightFt(val);
                        syncFromFtIn(widthFt, widthIn, val, heightIn);
                      }}
                      className="mt-1"
                      placeholder="6"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    {dict.calculator.inches} (in)
                    <input
                      type="number"
                      min={0}
                      max={11.9}
                      step="any"
                      required
                      value={heightIn}
                      onChange={e => {
                        const val = e.target.value;
                        setHeightIn(val);
                        syncFromFtIn(widthFt, widthIn, heightFt, val);
                      }}
                      className="mt-1"
                      placeholder="0"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Millimeters Inputs - Synchronized and Accessible for workshop accuracy & Playwright tests */}
          <div className={unit === 'mm' ? 'grid grid-cols-2 gap-4' : 'rounded-lg border border-slate-200 bg-slate-50 p-3'}>
            {unit !== 'mm' && (
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-2">
                <span>{locale === 'hi' ? 'कारखाना नाप (Workshop mm):' : 'Workshop equivalent (mm):'}</span>
                <span className="text-[11px] font-normal text-slate-500">{effectiveWidthMm} mm × {effectiveHeightMm} mm</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <label className="text-xs font-semibold text-slate-700">
                Width (mm)
                <input
                  className="mt-1"
                  type="number"
                  name="width_mm"
                  id="width_mm"
                  min={100}
                  max={20000}
                  required
                  value={widthMm}
                  onChange={e => {
                    const val = e.target.value;
                    setWidthMm(val);
                    syncFromMm(val, heightMm);
                  }}
                  placeholder="e.g. 3000"
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Height (mm)
                <input
                  className="mt-1"
                  type="number"
                  name="height_mm"
                  id="height_mm"
                  min={100}
                  max={10000}
                  required
                  value={heightMm}
                  onChange={e => {
                    const val = e.target.value;
                    setHeightMm(val);
                    syncFromMm(widthMm, val);
                  }}
                  placeholder="e.g. 1800"
                />
              </label>
            </div>
          </div>

          {['ft', 'in', 'm'].includes(unit) && (
            <div className="grid grid-cols-2 gap-4">
              <label className="text-xs font-semibold text-slate-700">
                Width ({unit === 'ft' ? 'Feet' : unit === 'in' ? 'Inches' : 'Meters'})
                <input
                  className="mt-2"
                  type="number"
                  step="any"
                  min={0.1}
                  required
                  value={widthDecimal}
                  onChange={e => {
                    const val = e.target.value;
                    setWidthDecimal(val);
                    const n = Number(val) || 0;
                    const mm = unit === 'ft' ? n * 304.8 : unit === 'in' ? n * 25.4 : n * 1000;
                    setWidthMm(String(Math.round(mm)));
                  }}
                  placeholder={unit === 'ft' ? 'e.g. 10' : unit === 'in' ? 'e.g. 120' : 'e.g. 3.0'}
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Height ({unit === 'ft' ? 'Feet' : unit === 'in' ? 'Inches' : 'Meters'})
                <input
                  className="mt-2"
                  type="number"
                  step="any"
                  min={0.1}
                  required
                  value={heightDecimal}
                  onChange={e => {
                    const val = e.target.value;
                    setHeightDecimal(val);
                    const n = Number(val) || 0;
                    const mm = unit === 'ft' ? n * 304.8 : unit === 'in' ? n * 25.4 : n * 1000;
                    setHeightMm(String(Math.round(mm)));
                  }}
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
                <span>{locale === 'hi' ? 'नाप और कुल क्षेत्रफल' : 'Equivalent Dimensions & Area'}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-md bg-white/90 p-2 border border-orange-100">
                  <span className="text-slate-400 block">{locale === 'hi' ? 'मिलीमीटर (mm):' : 'Metric (mm / m):'}</span>
                  <strong className="text-slate-900 font-semibold">{effectiveWidthMm.toLocaleString()} mm × {effectiveHeightMm.toLocaleString()} mm</strong>
                  <span className="text-slate-500 block mt-0.5">({(effectiveWidthMm / 1000).toFixed(2)} m × {(effectiveHeightMm / 1000).toFixed(2)} m)</span>
                </div>
                <div className="rounded-md bg-white/90 p-2 border border-orange-100">
                  <span className="text-slate-400 block">{locale === 'hi' ? 'फीट और इंच:' : 'Imperial (Feet & Inches):'}</span>
                  <strong className="text-slate-900 font-semibold">
                    {Math.floor(effectiveWidthMm / 304.8)} ft {Math.round((effectiveWidthMm % 304.8) / 25.4)} in × {Math.floor(effectiveHeightMm / 304.8)} ft {Math.round((effectiveHeightMm % 304.8) / 25.4)} in
                  </strong>
                  <span className="text-slate-500 block mt-0.5">{locale === 'hi' ? 'क्षेत्रफल:' : 'Area:'} <strong>{areaSqFt} sq. ft.</strong> ({areaSqM} m²)</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs leading-6 text-slate-500">
            {locale === 'hi'
              ? '⚡ नाप को वर्कशॉप मिलीमीटर में बदला जाता है। यह अनुमान मटीरियल और वर्कशॉप दरों पर आधारित है।'
              : 'Dimensions are converted to workshop millimetres. Published workshop material and pricing rules determine this estimate.'}
          </p>

          {error && (
            <p role="alert" className="rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={busy || !selectedProduct}
            aria-label="Calculate approximate price"
            className="w-full sm:w-auto"
          >
            {busy ? (dict.calculator.calculating || 'Calculating…') : (locale === 'hi' ? 'कीमत का अनुमान देखें (Calculate approximate price)' : 'Calculate approximate price')}
            <ArrowRight size={15} />
          </Button>
        </fieldset>
      </form>

      <section className="card p-6" aria-live="polite">
        {result ? (
          <>
            <div className="eyebrow text-orange-600">
              {locale === 'hi' ? 'अनुमानित कीमत' : 'Approximate estimate'}
            </div>
            <div className="mt-4 text-3xl font-bold text-slate-900">
              {money(result.min_minor)} – {money(result.max_minor)}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {result.area_sq_m} m² · {locale === 'hi' ? 'अनुमानित मटीरियल वजन:' : 'Approximate material weight:'} {result.weight_kg} kg
            </p>
            <div className="mt-6 overflow-x-auto">
              <SnapshotTable>
                <thead>
                  <tr>
                    <th>{locale === 'hi' ? 'सामान (Material)' : 'Material'}</th>
                    <th>{locale === 'hi' ? 'मात्रा (Quantity)' : 'Quantity'}</th>
                    <th>{locale === 'hi' ? 'रकम (Amount)' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.materials.map((m, i) => (
                    <tr key={i}>
                      <td>{m.name}</td>
                      <td data-sort-value={m.quantity}>
                        {m.quantity} {m.unit}
                      </td>
                      <td data-sort-value={m.amount_minor}>{money(m.amount_minor)}</td>
                    </tr>
                  ))}
                </tbody>
              </SnapshotTable>
            </div>
            {!result.materials.length && (
              <p className="mt-3 text-sm text-slate-500">
                {locale === 'hi' ? 'मटीरियल का विवरण कोटेशन में दिया जाएगा।' : 'Material details will be confirmed in the quotation.'}
              </p>
            )}
            <p className="mt-5 rounded-lg bg-orange-50 p-3 text-xs leading-6 text-orange-800">
              {result.notice}
            </p>
            <Button asChild className="mt-5 w-full sm:w-auto" aria-label="Request exact quotation">
              <Link
                href={
                  '/contact?product=' +
                  encodeURIComponent(selectedProduct) +
                  (dimensions ? '&width_mm=' + dimensions.width + '&height_mm=' + dimensions.height : '')
                }
              >
                {locale === 'hi' ? 'पक्का कोटेशन / रेट मँगवाएँ (Request exact quotation)' : 'Request exact quotation'}
              </Link>
            </Button>
          </>
        ) : (
          <div className="grid h-full min-h-72 place-content-center text-center p-4">
            <Ruler className="mx-auto mb-4 text-slate-300" size={36} />
            <h2 className="text-lg font-bold text-slate-900">
              {locale === 'hi' ? 'बनवाने से पहले खर्च जानें' : 'Plan before you build'}
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
              {locale === 'hi'
                ? 'अपनी सुविधा अनुसार फीट या मिलीमीटर में नाप भरें और तुरंत अनुमानित खर्च देखें।'
                : 'Select your preferred unit (mm, Feet + Inch, Feet, Inch, or Meter) and enter dimensions for an approximate estimate.'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

