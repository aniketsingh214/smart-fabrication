'use client';

import React, { useState, useId } from 'react';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notify';
import {
  ANGLE_OPTIONS,
  SHEET_OPTIONS,
  SUPPORT_OPTIONS,
  STANDARD_GATE_SIZES,
  calculateFabricationWeight,
  calculateFabricationPrice,
  feetToMm,
  type AngleSpec,
  type SheetSpec,
  type SupportSpec,
} from './fabrication-calculator';
import { Scale, Plus, CheckCircle2, ChevronDown, ChevronUp, Sparkles, AlertCircle } from 'lucide-react';

interface SizeRowState {
  id: string;
  selected: boolean;
  label: string;
  heightFeet: number;
  widthFeet: number;
  widthMm: number;
  heightMm: number;
  angleWeightKg: number;
  sheetWeightKg: number;
  supportWeightKg: number;
  hardwareWeightKg: number;
  totalWeightKg: number;
  priceInr: number;
  skuSuffix: string;
}

export function FabricationGenerator({
  productId,
  productSku,
  productName,
  onUpdated,
}: {
  productId: string;
  productSku: string;
  productName: string;
  onUpdated: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pricingModel, setPricingModel] = useState<'per_kg' | 'fixed'>('per_kg');
  const [ratePerKg, setRatePerKg] = useState<number>(110);
  const [selectedAngleId, setSelectedAngleId] = useState<string>(ANGLE_OPTIONS[0].id);
  const [selectedSheetId, setSelectedSheetId] = useState<string>(SHEET_OPTIONS[0].id);
  const [selectedSupportId, setSelectedSupportId] = useState<string>(SUPPORT_OPTIONS[0].id);

  // Custom size input state
  const [newHeightFeet, setNewHeightFeet] = useState<string>('8');
  const [newWidthFeet, setNewWidthFeet] = useState<string>('4');

  const angle = ANGLE_OPTIONS.find((a) => a.id === selectedAngleId) ?? ANGLE_OPTIONS[0];
  const sheet = SHEET_OPTIONS.find((s) => s.id === selectedSheetId) ?? SHEET_OPTIONS[0];
  const support = SUPPORT_OPTIONS.find((sp) => sp.id === selectedSupportId) ?? SUPPORT_OPTIONS[0];

  const buildInitialRows = (
    currentAngle: AngleSpec,
    currentSheet: SheetSpec,
    currentSupport: SupportSpec,
    model: 'per_kg' | 'fixed',
    rate: number
  ): SizeRowState[] => {
    return STANDARD_GATE_SIZES.map((preset) => {
      const breakdown = calculateFabricationWeight(
        preset.heightFeet,
        preset.widthFeet,
        currentAngle,
        currentSheet,
        currentSupport
      );
      const { priceInr } = calculateFabricationPrice(
        breakdown.totalWeightKg,
        model,
        rate,
        Math.round(breakdown.totalWeightKg * 110)
      );
      const suffix = `${preset.heightFeet}X${String(preset.widthFeet).replace('.', '_')}`;
      return {
        id: preset.id,
        selected: true,
        label: preset.label,
        heightFeet: preset.heightFeet,
        widthFeet: preset.widthFeet,
        widthMm: preset.widthMm,
        heightMm: preset.heightMm,
        angleWeightKg: breakdown.angleWeightKg,
        sheetWeightKg: breakdown.sheetWeightKg,
        supportWeightKg: breakdown.supportWeightKg,
        hardwareWeightKg: breakdown.hardwareWeightKg,
        totalWeightKg: breakdown.totalWeightKg,
        priceInr,
        skuSuffix: suffix,
      };
    });
  };

  const [rows, setRows] = useState<SizeRowState[]>(() =>
    buildInitialRows(angle, sheet, support, pricingModel, ratePerKg)
  );

  // Recalculate weights and prices when materials or rate change
  const handleRecalculate = (
    newAngleId = selectedAngleId,
    newSheetId = selectedSheetId,
    newSupportId = selectedSupportId,
    newModel = pricingModel,
    newRate = ratePerKg
  ) => {
    const a = ANGLE_OPTIONS.find((item) => item.id === newAngleId) ?? angle;
    const s = SHEET_OPTIONS.find((item) => item.id === newSheetId) ?? sheet;
    const sp = SUPPORT_OPTIONS.find((item) => item.id === newSupportId) ?? support;

    setRows((prev) =>
      prev.map((r) => {
        const breakdown = calculateFabricationWeight(r.heightFeet, r.widthFeet, a, s, sp);
        const { priceInr } = calculateFabricationPrice(
          breakdown.totalWeightKg,
          newModel,
          newRate,
          r.priceInr || Math.round(breakdown.totalWeightKg * 110)
        );
        return {
          ...r,
          angleWeightKg: breakdown.angleWeightKg,
          sheetWeightKg: breakdown.sheetWeightKg,
          supportWeightKg: breakdown.supportWeightKg,
          hardwareWeightKg: breakdown.hardwareWeightKg,
          totalWeightKg: breakdown.totalWeightKg,
          priceInr: newModel === 'per_kg' ? priceInr : r.priceInr,
        };
      })
    );
  };

  const toggleRowSelected = (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)));
  };

  const updateRowWeight = (id: string, weight: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const newWeight = Math.max(1, weight);
        const newPrice =
          pricingModel === 'per_kg'
            ? calculateFabricationPrice(newWeight, 'per_kg', ratePerKg).priceInr
            : r.priceInr;
        return { ...r, totalWeightKg: newWeight, priceInr: newPrice };
      })
    );
  };

  const updateRowPrice = (id: string, price: number) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, priceInr: Math.max(0, price) } : r)));
  };

  const handleAddCustomSize = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(newHeightFeet);
    const w = parseFloat(newWidthFeet);
    if (!h || !w || h <= 0 || w <= 0) {
      notify('कृपया सही ऊंचाई और चौड़ाई दर्ज करें', 'error');
      return;
    }
    const breakdown = calculateFabricationWeight(h, w, angle, sheet, support);
    const { priceInr } = calculateFabricationPrice(breakdown.totalWeightKg, pricingModel, ratePerKg);
    const customId = `custom-${Date.now()}`;
    const suffix = `${h}X${String(w).replace('.', '_')}`;

    setRows((prev) => [
      ...prev,
      {
        id: customId,
        selected: true,
        label: `${h} × ${w} फीट (कस्टम साइज)`,
        heightFeet: h,
        widthFeet: w,
        widthMm: feetToMm(w),
        heightMm: feetToMm(h),
        angleWeightKg: breakdown.angleWeightKg,
        sheetWeightKg: breakdown.sheetWeightKg,
        supportWeightKg: breakdown.supportWeightKg,
        hardwareWeightKg: breakdown.hardwareWeightKg,
        totalWeightKg: breakdown.totalWeightKg,
        priceInr,
        skuSuffix: suffix,
      },
    ]);
    notify(`${h} × ${w} फीट साइज टेबल में जोड़ा गया`);
  };

  const handleSaveVariants = async () => {
    const selectedRows = rows.filter((r) => r.selected);
    if (!selectedRows.length) {
      notify('कृपया कम से कम एक साइज चुनें', 'error');
      return;
    }

    setBusy(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const row of selectedRows) {
        const payload = {
          product_id: productId,
          name: `${row.label} (~${row.totalWeightKg} kg)`,
          sku: `${productSku}-${row.skuSuffix}`.slice(0, 100),
          width_mm: row.widthMm,
          height_mm: row.heightMm,
          colour: `${sheet.gauge} चादर`,
          finish: `${angle.label.split(' ')[0]} एंगल + ${support.label.split(' ')[0]} सपोर्ट`,
          price_min_minor: row.priceInr * 100,
          price_max_minor: row.priceInr * 100,
          status: 'published',
        };

        const res = await fetch('/api/v1/admin/product-variants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': crypto.randomUUID(),
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          successCount++;
        } else {
          // If already exists with SKU, update it
          failCount++;
        }
      }

      // Also update base product with starting price & weight from the first variant
      const minRow = selectedRows.reduce((prev, curr) =>
        prev.priceInr < curr.priceInr ? prev : curr
      );
      await fetch(`/api/v1/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_min_minor: minRow.priceInr * 100,
          weight_kg: minRow.totalWeightKg,
          material: `Mild Steel (${sheet.gauge} + ${angle.label.split(' ')[0]})`,
        }),
      });

      notify(
        `${successCount} साइज वेरिएंट्स सफलतापूर्वक जोड़े गए! प्रोडक्ट का बेस रेट भी अपडेट कर दिया गया है।`
      );
      onUpdated();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'साइज सेव करने में समस्या आई', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white shadow-sm">
            <Scale size={20} />
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              ⚡ फैब्रिकेशन साइज व रेट जेनरेटर (Fabrication Sizing & Rate Generator)
            </h3>
            <p className="text-xs text-slate-600">
              सादा दरवाजा/गेट के लिए एंगल, चादर (गेज) व सरिया चुनकर मल्टीपल साइज (6×3, 8×3, 8×3.4, 8×3.5) के वजन और दाम ऑटो-कैलकुलेट करें।
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white border-orange-300 text-orange-800 hover:bg-orange-100"
        >
          {isOpen ? (
            <>
              छिपाएं <ChevronUp size={15} />
            </>
          ) : (
            <>
              साइज व मटेरियल सेट करें <ChevronDown size={15} />
            </>
          )}
        </Button>
      </div>

      {isOpen && (
        <div className="mt-5 space-y-6 border-t border-orange-200/80 pt-5">
          {/* Step 1: Pricing Model */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              स्टेप 1: सेलिंग मॉडल चुनें (Pricing Mode)
            </h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                  pricingModel === 'per_kg'
                    ? 'border-orange-500 bg-orange-50/60 ring-1 ring-orange-400'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="pricing_mode"
                  checked={pricingModel === 'per_kg'}
                  onChange={() => {
                    setPricingModel('per_kg');
                    handleRecalculate(selectedAngleId, selectedSheetId, selectedSupportId, 'per_kg');
                  }}
                  className="mt-1 accent-orange-600"
                />
                <div>
                  <strong className="block text-sm font-semibold text-slate-900">
                    विकल्प A: प्रति किलो भाव (Per Kg Rate)
                  </strong>
                  <p className="text-xs text-slate-500">
                    वजन के अनुसार सटीक दाम। जब वजन बदलेगा तो कुल कीमत अपने आप कैलकुलेट होगी।
                  </p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                  pricingModel === 'fixed'
                    ? 'border-orange-500 bg-orange-50/60 ring-1 ring-orange-400'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="pricing_mode"
                  checked={pricingModel === 'fixed'}
                  onChange={() => {
                    setPricingModel('fixed');
                    handleRecalculate(selectedAngleId, selectedSheetId, selectedSupportId, 'fixed');
                  }}
                  className="mt-1 accent-orange-600"
                />
                <div>
                  <strong className="block text-sm font-semibold text-slate-900">
                    विकल्प C: फिक्स रेट (Fixed Piece Rate)
                  </strong>
                  <p className="text-xs text-slate-500">
                    हर साइज का एक मुश्त फिक्स दाम (जैसे 6×3 का ₹4,000, 8×3 का ₹5,100)।
                  </p>
                </div>
              </label>
            </div>

            {pricingModel === 'per_kg' && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-orange-100/60 p-3">
                <label className="text-xs font-semibold text-orange-900">
                  प्रति किलो रेट तय करें (₹ / kg):
                </label>
                <input
                  type="number"
                  min="50"
                  max="1000"
                  step="1"
                  value={ratePerKg}
                  onChange={(e) => {
                    const r = Number(e.target.value) || 110;
                    setRatePerKg(r);
                    handleRecalculate(selectedAngleId, selectedSheetId, selectedSupportId, 'per_kg', r);
                  }}
                  className="w-28 rounded-md border border-orange-300 bg-white px-3 py-1.5 text-sm font-bold text-orange-950"
                />
                <span className="text-xs text-orange-800">
                  (जैसे ₹110/किलो या ₹115/किलो)
                </span>
              </div>
            )}
          </div>

          {/* Step 2: Fabrication Materials */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              स्टेप 2: मटेरियल स्पेसिफिकेशन (Angle, Sheet & Support)
            </h4>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  1. फ्रेम एंगल (Frame Angle)
                </label>
                <select
                  value={selectedAngleId}
                  onChange={(e) => {
                    setSelectedAngleId(e.target.value);
                    handleRecalculate(e.target.value, selectedSheetId, selectedSupportId);
                  }}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 p-2 text-xs"
                >
                  {ANGLE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label} (~{opt.weightKgPerFoot} kg/ft)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  2. चादर / गेज (Sheet Face)
                </label>
                <select
                  value={selectedSheetId}
                  onChange={(e) => {
                    setSelectedSheetId(e.target.value);
                    handleRecalculate(selectedAngleId, e.target.value, selectedSupportId);
                  }}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 p-2 text-xs"
                >
                  {SHEET_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label} (~{opt.weightKgPerSqFt} kg/sq.ft)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  3. सपोर्ट सरिया / पत्ती (Internal Support)
                </label>
                <select
                  value={selectedSupportId}
                  onChange={(e) => {
                    setSelectedSupportId(e.target.value);
                    handleRecalculate(selectedAngleId, selectedSheetId, e.target.value);
                  }}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 p-2 text-xs"
                >
                  {SUPPORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              * कब्जा, कुंडी व सिटकनी फिटिंग्स का वजन फिक्स 2.0 kg स्वतः जोड़ा जाता है।
            </p>
          </div>

          {/* Step 3: Size Variants Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  स्टेप 3: साइज और वजन लिस्ट (Sizes & Pricing Table)
                </h4>
                <p className="text-xs text-slate-500">
                  सिस्टम ने एंगल + चादर + सरिया जोड़कर हर साइज का वजन और दाम निकाल दिया है। आप आवश्यकतानुसार वजन या रेट बदल भी सकते हैं।
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="p-2.5">चुनें</th>
                    <th className="p-2.5">साइज (फीट)</th>
                    <th className="p-2.5">नाप (MM)</th>
                    <th className="p-2.5">एंगल</th>
                    <th className="p-2.5">चादर</th>
                    <th className="p-2.5">सपोर्ट+फिटिंग</th>
                    <th className="p-2.5">कुल वजन (kg)</th>
                    <th className="p-2.5">कीमत (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50/80 ${row.selected ? 'bg-orange-50/30' : 'opacity-60'}`}
                    >
                      <td className="p-2.5">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={() => toggleRowSelected(row.id)}
                          className="h-4 w-4 accent-orange-600 rounded"
                        />
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">{row.label}</td>
                      <td className="p-2.5 text-slate-500">
                        {row.heightMm} × {row.widthMm} mm
                      </td>
                      <td className="p-2.5 text-slate-600">{row.angleWeightKg} kg</td>
                      <td className="p-2.5 text-slate-600">{row.sheetWeightKg} kg</td>
                      <td className="p-2.5 text-slate-600">
                        {Math.round((row.supportWeightKg + row.hardwareWeightKg) * 10) / 10} kg
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.5"
                          min="5"
                          max="500"
                          value={row.totalWeightKg}
                          onChange={(e) => updateRowWeight(row.id, parseFloat(e.target.value) || 0)}
                          className="w-20 rounded border border-slate-300 px-2 py-1 font-bold text-slate-900"
                        />
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">₹</span>
                          <input
                            type="number"
                            step="50"
                            min="500"
                            value={row.priceInr}
                            onChange={(e) => updateRowPrice(row.id, parseInt(e.target.value) || 0)}
                            className="w-24 rounded border border-orange-300 bg-orange-50/50 px-2 py-1 font-bold text-orange-950"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Add Custom Size */}
            <form
              onSubmit={handleAddCustomSize}
              className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3"
            >
              <span className="text-xs font-semibold text-slate-700">
                + कोई अन्य साइज जोड़ें:
              </span>
              <label className="flex items-center gap-1 text-xs">
                ऊंचाई (फीट):
                <input
                  type="number"
                  step="0.1"
                  min="2"
                  max="20"
                  value={newHeightFeet}
                  onChange={(e) => setNewHeightFeet(e.target.value)}
                  className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                />
              </label>
              <span className="text-slate-400">×</span>
              <label className="flex items-center gap-1 text-xs">
                चौड़ाई (फीट):
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="20"
                  value={newWidthFeet}
                  onChange={(e) => setNewWidthFeet(e.target.value)}
                  className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                />
              </label>
              <Button type="submit" size="sm" variant="outline" className="bg-white">
                <Plus size={13} /> टेबल में जोड़ें
              </Button>
            </form>
          </div>

          {/* Action Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-orange-600 p-4 text-white shadow-md">
            <div>
              <p className="text-xs uppercase tracking-wider text-orange-200">
                तैयार साइज वेरिएंट्स
              </p>
              <p className="text-sm font-semibold">
                कुल {rows.filter((r) => r.selected).length} साइज इस प्रोडक्ट में सेव किए जाएंगे
              </p>
            </div>
            <Button
              type="button"
              disabled={busy || !rows.some((r) => r.selected)}
              onClick={handleSaveVariants}
              className="bg-white text-orange-900 hover:bg-orange-50 font-bold shadow"
            >
              {busy ? (
                'वेरिएंट्स सेव हो रहे हैं...'
              ) : (
                <>
                  <CheckCircle2 size={16} /> सभी साइज व रेट सेव करें
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
