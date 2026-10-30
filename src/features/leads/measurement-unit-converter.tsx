'use client';

import React, { useState, useEffect, useId } from 'react';
import { Ruler, Sparkles, Check, RefreshCw } from 'lucide-react';

export type MeasurementUnit = 'feet_inch' | 'inch' | 'cm' | 'meter' | 'mm';

interface UnitOption {
  key: MeasurementUnit;
  labelHi: string;
  labelEn: string;
  symbol: string;
  example: string;
}

const UNITS: UnitOption[] = [
  {
    key: 'feet_inch',
    labelHi: 'फीट और इंच (Feet & Inches)',
    labelEn: 'Feet & Inches',
    symbol: `ft & in (' ")`,
    example: `उदा. 7' 6" × 6' 0"`,
  },
  {
    key: 'inch',
    labelHi: 'इंच (Inches)',
    labelEn: 'Inches',
    symbol: 'in (")',
    example: 'उदा. 90" × 72"',
  },
  {
    key: 'cm',
    labelHi: 'सेंटीमीटर (Centimeters)',
    labelEn: 'Centimeters (cm)',
    symbol: 'cm',
    example: 'उदा. 228.6 cm × 182.9 cm',
  },
  {
    key: 'meter',
    labelHi: 'मीटर (Meters)',
    labelEn: 'Meters (m)',
    symbol: 'm',
    example: 'उदा. 2.28 m × 1.83 m',
  },
  {
    key: 'mm',
    labelHi: 'मिलीमीटर (Millimeters)',
    labelEn: 'Millimeters (mm)',
    symbol: 'mm',
    example: 'उदा. 2286 mm × 1829 mm',
  },
];

function sanitizeNumber(val: string): string {
  if (!val) return '';
  if (/^0+[1-9]/.test(val)) return val.replace(/^0+/, '');
  if (/^00+\./.test(val)) return val.replace(/^0+/, '0');
  return val;
}

export function MeasurementUnitConverter({
  initialWidthMm,
  initialHeightMm,
  initialDepthMm,
  onNotesSuggestion,
}: {
  initialWidthMm?: number | null;
  initialHeightMm?: number | null;
  initialDepthMm?: number | null;
  onNotesSuggestion?: (summary: string) => void;
}) {
  const [unit, setUnit] = useState<MeasurementUnit>('feet_inch');

  // Feet & Inch values
  const [wFeet, setWFeet] = useState<string>('');
  const [wInch, setWInch] = useState<string>('');
  const [hFeet, setHFeet] = useState<string>('');
  const [hInch, setHInch] = useState<string>('');
  const [dInch, setDInch] = useState<string>('');

  // Single unit values (inch, cm, meter, mm)
  const [wSingle, setWSingle] = useState<string>('');
  const [hSingle, setHSingle] = useState<string>('');
  const [dSingle, setDSingle] = useState<string>('');

  const unitSelectId = useId();

  // Populate from existing mm if editing or initialized
  useEffect(() => {
    if (initialWidthMm && initialHeightMm) {
      const wTotalIn = initialWidthMm / 25.4;
      const hTotalIn = initialHeightMm / 25.4;

      const wf = Math.floor(wTotalIn / 12);
      const wi = Math.round((wTotalIn % 12) * 10) / 10;
      const hf = Math.floor(hTotalIn / 12);
      const hi = Math.round((hTotalIn % 12) * 10) / 10;

      setWFeet(wf > 0 ? String(wf) : '');
      setWInch(wi > 0 ? String(wi) : '');
      setHFeet(hf > 0 ? String(hf) : '');
      setHInch(hi > 0 ? String(hi) : '');

      if (initialDepthMm) {
        const di = Math.round((initialDepthMm / 25.4) * 10) / 10;
        setDInch(di > 0 ? String(di) : '');
      }
    }
  }, [initialWidthMm, initialHeightMm, initialDepthMm]);

  // Compute MM
  let widthMm = 0;
  let heightMm = 0;
  let depthMm: number | null = null;
  let readableSummary = '';

  if (unit === 'feet_inch') {
    const wf = Number(wFeet) || 0;
    const wi = Number(wInch) || 0;
    const hf = Number(hFeet) || 0;
    const hi = Number(hInch) || 0;
    const di = Number(dInch) || 0;

    const totalWIn = wf * 12 + wi;
    const totalHIn = hf * 12 + hi;

    widthMm = totalWIn > 0 ? Math.round(totalWIn * 25.4) : 0;
    heightMm = totalHIn > 0 ? Math.round(totalHIn * 25.4) : 0;
    depthMm = di > 0 ? Math.round(di * 25.4) : null;

    if (widthMm > 0 && heightMm > 0) {
      readableSummary = `${wf}' ${wi}" W × ${hf}' ${hi}" H (Feet & Inches)`;
      if (di > 0) readableSummary += ` × ${di}" Depth`;
    }
  } else if (unit === 'inch') {
    const w = Number(wSingle) || 0;
    const h = Number(hSingle) || 0;
    const d = Number(dSingle) || 0;

    widthMm = w > 0 ? Math.round(w * 25.4) : 0;
    heightMm = h > 0 ? Math.round(h * 25.4) : 0;
    depthMm = d > 0 ? Math.round(d * 25.4) : null;

    if (widthMm > 0 && heightMm > 0) {
      readableSummary = `${w}" W × ${h}" H (Inches)`;
      if (d > 0) readableSummary += ` × ${d}" Depth`;
    }
  } else if (unit === 'cm') {
    const w = Number(wSingle) || 0;
    const h = Number(hSingle) || 0;
    const d = Number(dSingle) || 0;

    widthMm = w > 0 ? Math.round(w * 10) : 0;
    heightMm = h > 0 ? Math.round(h * 10) : 0;
    depthMm = d > 0 ? Math.round(d * 10) : null;

    if (widthMm > 0 && heightMm > 0) {
      readableSummary = `${w} cm W × ${h} cm H (Centimeters)`;
      if (d > 0) readableSummary += ` × ${d} cm Depth`;
    }
  } else if (unit === 'meter') {
    const w = Number(wSingle) || 0;
    const h = Number(hSingle) || 0;
    const d = Number(dSingle) || 0;

    widthMm = w > 0 ? Math.round(w * 1000) : 0;
    heightMm = h > 0 ? Math.round(h * 1000) : 0;
    depthMm = d > 0 ? Math.round(d * 1000) : null;

    if (widthMm > 0 && heightMm > 0) {
      readableSummary = `${w} m W × ${h} m H (Meters)`;
      if (d > 0) readableSummary += ` × ${d} m Depth`;
    }
  } else {
    // mm
    const w = Number(wSingle) || 0;
    const h = Number(hSingle) || 0;
    const d = Number(dSingle) || 0;

    widthMm = w > 0 ? Math.round(w) : 0;
    heightMm = h > 0 ? Math.round(h) : 0;
    depthMm = d > 0 ? Math.round(d) : null;

    if (widthMm > 0 && heightMm > 0) {
      readableSummary = `${w} mm W × ${h} mm H (Millimeters)`;
      if (d > 0) readableSummary += ` × ${d} mm Depth`;
    }
  }

  // Calculate Square Feet & Square Metre
  const areaSqFt =
    widthMm > 0 && heightMm > 0 ? (widthMm * heightMm) / (304.8 * 304.8) : 0;
  const areaSqM =
    widthMm > 0 && heightMm > 0 ? (widthMm * heightMm) / 1_000_000 : 0;
  const runningFt =
    widthMm > 0 && heightMm > 0 ? (2 * (widthMm + heightMm)) / 304.8 : 0;

  // Unit switch converter helper
  const handleUnitSwitch = (newUnit: MeasurementUnit) => {
    if (newUnit === unit) return;

    if (widthMm > 0 && heightMm > 0) {
      if (newUnit === 'feet_inch') {
        const wIn = widthMm / 25.4;
        const hIn = heightMm / 25.4;
        setWFeet(String(Math.floor(wIn / 12)));
        setWInch(String(Math.round((wIn % 12) * 10) / 10));
        setHFeet(String(Math.floor(hIn / 12)));
        setHInch(String(Math.round((hIn % 12) * 10) / 10));
        if (depthMm) {
          const dIn = depthMm / 25.4;
          setDInch(String(Math.round(dIn * 10) / 10));
        }
      } else if (newUnit === 'inch') {
        setWSingle(String(Math.round((widthMm / 25.4) * 100) / 100));
        setHSingle(String(Math.round((heightMm / 25.4) * 100) / 100));
        setDSingle(depthMm ? String(Math.round((depthMm / 25.4) * 100) / 100) : '');
      } else if (newUnit === 'cm') {
        setWSingle(String(Math.round((widthMm / 10) * 10) / 10));
        setHSingle(String(Math.round((heightMm / 10) * 10) / 10));
        setDSingle(depthMm ? String(Math.round((depthMm / 10) * 10) / 10) : '');
      } else if (newUnit === 'meter') {
        setWSingle(String(Math.round((widthMm / 1000) * 1000) / 1000));
        setHSingle(String(Math.round((heightMm / 1000) * 1000) / 1000));
        setDSingle(depthMm ? String(Math.round((depthMm / 1000) * 1000) / 1000) : '');
      } else if (newUnit === 'mm') {
        setWSingle(String(widthMm));
        setHSingle(String(heightMm));
        setDSingle(depthMm ? String(depthMm) : '');
      }
    } else {
      // Clear single / feet inputs
      if (newUnit === 'feet_inch') {
        setWFeet('');
        setWInch('');
        setHFeet('');
        setHInch('');
        setDInch('');
      } else {
        setWSingle('');
        setHSingle('');
        setDSingle('');
      }
    }
    setUnit(newUnit);
  };

  return (
    <div className="sm:col-span-2 rounded-xl border border-orange-200 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/40 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Hidden canonical form fields for database submission */}
      <input
        type="hidden"
        name="width_mm"
        value={widthMm > 0 ? widthMm : ''}
        required
      />
      <input
        type="hidden"
        name="height_mm"
        value={heightMm > 0 ? heightMm : ''}
        required
      />
      <input
        type="hidden"
        name="depth_mm"
        value={depthMm !== null && depthMm > 0 ? depthMm : ''}
      />
      {readableSummary && (
        <input
          type="hidden"
          name="_measurement_readable"
          value={readableSummary}
        />
      )}

      {/* Header and Unit Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-orange-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white shadow-xs">
            <Ruler size={19} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              नाप दर्ज करें (Site Measurements)
            </h3>
            <p className="text-xs text-slate-500">
              अपनी पसंद की यूनिट चुनें (फीट-इंच, इंच, cm, मीटर या mm)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor={unitSelectId}
            className="text-xs font-semibold text-slate-600 whitespace-nowrap"
          >
            नापने की यूनिट (Unit):
          </label>
          <select
            id={unitSelectId}
            value={unit}
            onChange={(e) => handleUnitSwitch(e.target.value as MeasurementUnit)}
            className="h-9 rounded-md border border-orange-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            {UNITS.map((u) => (
              <option key={u.key} value={u.key}>
                {u.labelHi}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual Unit Selector Pills */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {UNITS.map((u) => {
          const isSelected = unit === u.key;
          return (
            <button
              key={u.key}
              type="button"
              onClick={() => handleUnitSwitch(u.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-orange-600 text-white shadow-xs font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50'
              }`}
            >
              {isSelected && <Check size={12} className="stroke-[3]" />}
              <span>{u.labelEn}</span>
              <span className={`text-[10px] ${isSelected ? 'text-orange-200' : 'text-slate-400'}`}>
                ({u.symbol})
              </span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Input Rows depending on selected unit */}
      {unit === 'feet_inch' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Width in Feet + Inches */}
          <div className="rounded-lg border border-slate-200/90 bg-white p-3 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              चौड़ाई (Width) <span className="text-orange-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-[10px] font-semibold text-slate-500">फीट (Feet)</span>
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="1"
                  placeholder="उदा. 7"
                  value={wFeet}
                  onFocus={(e) => {
                    if (e.target.value === '0') setWFeet('');
                    else e.target.select();
                  }}
                  onChange={(e) => setWFeet(sanitizeNumber(e.target.value))}
                  className="mt-1 w-full rounded border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-slate-500">इंच (Inches)</span>
                <input
                  type="number"
                  min="0"
                  max="11.99"
                  step="any"
                  placeholder="उदा. 6"
                  value={wInch}
                  onFocus={(e) => {
                    if (e.target.value === '0') setWInch('');
                    else e.target.select();
                  }}
                  onChange={(e) => setWInch(sanitizeNumber(e.target.value))}
                  className="mt-1 w-full rounded border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
            {widthMm > 0 && (
              <p className="text-[11px] font-medium text-slate-500">
                = <span className="font-bold text-slate-700">{widthMm} mm</span> ({(widthMm / 25.4).toFixed(1)}&quot;)
              </p>
            )}
          </div>

          {/* Height in Feet + Inches */}
          <div className="rounded-lg border border-slate-200/90 bg-white p-3 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              ऊंचाई (Height) <span className="text-orange-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-[10px] font-semibold text-slate-500">फीट (Feet)</span>
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="1"
                  placeholder="उदा. 6"
                  value={hFeet}
                  onFocus={(e) => {
                    if (e.target.value === '0') setHFeet('');
                    else e.target.select();
                  }}
                  onChange={(e) => setHFeet(sanitizeNumber(e.target.value))}
                  className="mt-1 w-full rounded border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-slate-500">इंच (Inches)</span>
                <input
                  type="number"
                  min="0"
                  max="11.99"
                  step="any"
                  placeholder="उदा. 0"
                  value={hInch}
                  onFocus={(e) => {
                    if (e.target.value === '0') setHInch('');
                    else e.target.select();
                  }}
                  onChange={(e) => setHInch(sanitizeNumber(e.target.value))}
                  className="mt-1 w-full rounded border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
            {heightMm > 0 && (
              <p className="text-[11px] font-medium text-slate-500">
                = <span className="font-bold text-slate-700">{heightMm} mm</span> ({(heightMm / 25.4).toFixed(1)}&quot;)
              </p>
            )}
          </div>

          {/* Depth / Thickness in Inches */}
          <div className="rounded-lg border border-slate-200/90 bg-white p-3 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              गहराई / फ्रेम मोटाई (Depth) <span className="text-slate-400 font-normal">(वैकल्पिक)</span>
            </label>
            <div>
              <span className="block text-[10px] font-semibold text-slate-500">इंच (Inches)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="any"
                placeholder="उदा. 2 (गेट/फ्रेम मोटाई)"
                value={dInch}
                onFocus={(e) => {
                  if (e.target.value === '0') setDInch('');
                  else e.target.select();
                }}
                onChange={(e) => setDInch(sanitizeNumber(e.target.value))}
                className="mt-1 w-full rounded border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
            {depthMm !== null && depthMm > 0 && (
              <p className="text-[11px] font-medium text-slate-500">
                = <span className="font-bold text-slate-700">{depthMm} mm</span>
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Single unit input fields (inch, cm, meter, mm) */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Width */}
          <div className="rounded-lg border border-slate-200/90 bg-white p-3 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              चौड़ाई (Width) in {unit.toUpperCase()}{' '}
              <span className="text-orange-600">*</span>
            </label>
            <input
              type="number"
              min="0.1"
              step="any"
              placeholder={`उदा. ${unit === 'inch' ? '90' : unit === 'cm' ? '228.6' : unit === 'meter' ? '2.28' : '2286'}`}
              value={wSingle}
              onFocus={(e) => {
                if (e.target.value === '0') setWSingle('');
                else e.target.select();
              }}
              onChange={(e) => setWSingle(sanitizeNumber(e.target.value))}
              className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            {widthMm > 0 && (
              <p className="text-[11px] font-medium text-slate-500">
                = <span className="font-bold text-slate-700">{widthMm} mm</span> ({(widthMm / 304.8).toFixed(2)} ft)
              </p>
            )}
          </div>

          {/* Height */}
          <div className="rounded-lg border border-slate-200/90 bg-white p-3 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              ऊंचाई (Height) in {unit.toUpperCase()}{' '}
              <span className="text-orange-600">*</span>
            </label>
            <input
              type="number"
              min="0.1"
              step="any"
              placeholder={`उदा. ${unit === 'inch' ? '72' : unit === 'cm' ? '182.9' : unit === 'meter' ? '1.83' : '1829'}`}
              value={hSingle}
              onFocus={(e) => {
                if (e.target.value === '0') setHSingle('');
                else e.target.select();
              }}
              onChange={(e) => setHSingle(sanitizeNumber(e.target.value))}
              className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            {heightMm > 0 && (
              <p className="text-[11px] font-medium text-slate-500">
                = <span className="font-bold text-slate-700">{heightMm} mm</span> ({(heightMm / 304.8).toFixed(2)} ft)
              </p>
            )}
          </div>

          {/* Depth */}
          <div className="rounded-lg border border-slate-200/90 bg-white p-3 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              गहराई (Depth) in {unit.toUpperCase()}{' '}
              <span className="text-slate-400 font-normal">(वैकल्पिक)</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="उदा. फ्रेम मोटाई"
              value={dSingle}
              onFocus={(e) => {
                if (e.target.value === '0') setDSingle('');
                else e.target.select();
              }}
              onChange={(e) => setDSingle(sanitizeNumber(e.target.value))}
              className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            {depthMm !== null && depthMm > 0 && (
              <p className="text-[11px] font-medium text-slate-500">
                = <span className="font-bold text-slate-700">{depthMm} mm</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Live Calculated Output & Area Badge */}
      {widthMm > 0 && heightMm > 0 ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-sm">
              <Sparkles size={16} className="text-emerald-600" />
              <span>लाइव एरिया व कैलकुलेशन (Fabrication Estimation):</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>
                📐 <strong>कुल एरिया:</strong>{' '}
                <span className="font-bold text-emerald-800 text-sm">
                  {areaSqFt.toFixed(2)} Sq.Ft.
                </span>{' '}
                ({areaSqM.toFixed(2)} Sq.Metre)
              </span>
              <span>
                📏 <strong>रनिंग फीट (Perimeter):</strong>{' '}
                <span className="font-semibold text-emerald-800">
                  {runningFt.toFixed(1)} R.Ft.
                </span>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <div className="rounded bg-white/90 border border-emerald-200 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 shadow-2xs">
              ⚡ Database: {widthMm} × {heightMm} mm
            </div>
            {onNotesSuggestion && (
              <button
                type="button"
                onClick={() =>
                  onNotesSuggestion(
                    `[साइट नाप: ${readableSummary} | एरिया: ${areaSqFt.toFixed(2)} Sq.Ft]`
                  )
                }
                title="Notes में यह नाप दर्ज करें"
                className="inline-flex items-center gap-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1.5 text-[11px] font-medium shadow-2xs"
              >
                <Check size={13} />
                नोट्स में जोड़ें
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3 text-center text-xs text-slate-500">
          कृपया चौड़ाई और ऊंचाई भरें। आपका कुल एरिया (Sq.Ft) और mm कन्वर्शन यहाँ तुरंत दिखाई देगा।
        </div>
      )}
    </div>
  );
}
