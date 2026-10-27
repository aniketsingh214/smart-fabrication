'use client';

import React, { useState } from 'react';
import type { ProductVariant, ProductOption } from '@/contracts/catalog';
import { money } from '@/lib/utils';
import { mmToFeet, calculateFabricationWeight, calculateFabricationPrice } from './fabrication-calculator';
import { Check, Ruler, Scale, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function ProductConfiguration({
  variants,
  options,
  preview = false,
  productId,
}: {
  variants: ProductVariant[];
  options: ProductOption[];
  preview?: boolean;
  productId?: string;
}) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants[0]?.id ?? null
  );

  // Custom size calculator state
  const [showCustomCalc, setShowCustomCalc] = useState(false);
  const [customHeightFeet, setCustomHeightFeet] = useState<string>('8.0');
  const [customWidthFeet, setCustomWidthFeet] = useState<string>('3.4');

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];

  // Custom size calculation
  const hFeet = parseFloat(customHeightFeet) || 8.0;
  const wFeet = parseFloat(customWidthFeet) || 3.4;
  const customBreakdown = calculateFabricationWeight(hFeet, wFeet);
  const customPricing = calculateFabricationPrice(customBreakdown.totalWeightKg, 'per_kg', 110);

  return (
    <section className="mt-8 space-y-7" aria-label="Product choices">
      {/* 1. Size Variants Grid */}
      {variants.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                उपलब्ध साइज व वजन (Available Sizes)
              </h2>
              <p className="text-xs text-slate-500">
                अपनी जरूरत के अनुसार साइज चुनें — वजन और दाम तुरंत देखें।
              </p>
            </div>
            {selectedVariant && (
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
                चयनित: {selectedVariant.name}
              </span>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {variants.map((v) => {
              const isSelected = v.id === selectedVariantId;
              const hFt = v.height_mm ? mmToFeet(v.height_mm) : null;
              const wFt = v.width_mm ? mmToFeet(v.width_mm) : null;
              const feetLabel = hFt && wFt ? `${hFt} × ${wFt} फीट` : null;

              return (
                <button
                  type="button"
                  key={v.id}
                  onClick={() => setSelectedVariantId(v.id)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/50 shadow-sm ring-2 ring-orange-400'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition">
                        {v.name}
                      </h3>
                      {feetLabel && (
                        <p className="mt-0.5 text-xs font-semibold text-orange-700">
                          {feetLabel}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        {[
                          v.width_mm && v.height_mm ? `${v.height_mm} × ${v.width_mm} mm` : null,
                          v.colour,
                          v.finish,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>

                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                        isSelected
                          ? 'border-orange-600 bg-orange-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span className="font-semibold text-slate-700">
                      {v.price_min_minor ? money(v.price_min_minor) : 'कोटेशन पर'}
                    </span>
                    {preview && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                        {v.sku} · {v.status}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Variant Highlight Summary */}
          {selectedVariant && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                  <Scale size={16} />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{selectedVariant.name}</p>
                  <p className="text-slate-500">
                    एंगल फ्रेम + चादर + सरिया सपोर्ट सहित पूर्ण फिनिश्ड दरवाजा
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">अनुमानित कीमत:</span>
                <p className="text-base font-bold text-orange-600">
                  {selectedVariant.price_min_minor
                    ? money(selectedVariant.price_min_minor)
                    : 'नाप के बाद तय होगी'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Interactive Custom Size Calculator */}
      <div className="rounded-2xl border border-dashed border-orange-300 bg-orange-50/30 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white shadow-sm">
              <Ruler size={18} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                📐 अपनी नाप का दरवाजा बनवाएं (Custom Size Calculator)
              </h3>
              <p className="text-xs text-slate-600">
                अगर आपका साइज स्टैंडर्ड साइज से अलग है, तो यहाँ फीट में नाप डालकर वजन और अनुमानित लागत देखें।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCustomCalc(!showCustomCalc)}
            className="text-xs font-semibold text-orange-700 underline hover:text-orange-900"
          >
            {showCustomCalc ? 'कैलकुलेटर छिपाएं' : 'कैलकुलेटर खोलें'}
          </button>
        </div>

        {showCustomCalc && (
          <div className="mt-5 space-y-4 border-t border-orange-200/60 pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  दरवाजे की ऊंचाई (फीट):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="3"
                  max="15"
                  value={customHeightFeet}
                  onChange={(e) => setCustomHeightFeet(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900"
                  placeholder="8.0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  दरवाजे की चौड़ाई (फीट):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="2"
                  max="15"
                  value={customWidthFeet}
                  onChange={(e) => setCustomWidthFeet(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900"
                  placeholder="3.4"
                />
              </div>
            </div>

            {/* Calculated Breakdown Card */}
            <div className="rounded-xl border border-orange-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-800">
                अनुमानित फैब्रिकेशन ब्रेकडाउन ({hFeet} × {wFeet} फीट):
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <span className="text-slate-400">क्षेत्रफल:</span>
                  <p className="font-bold text-slate-900">{customBreakdown.areaSqFt} sq.ft</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <span className="text-slate-400">एंगल (फ्रेम):</span>
                  <p className="font-bold text-slate-900">{customBreakdown.angleWeightKg} kg</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <span className="text-slate-400">चादर (18G):</span>
                  <p className="font-bold text-slate-900">{customBreakdown.sheetWeightKg} kg</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <span className="text-slate-400">सपोर्ट + कब्जा:</span>
                  <p className="font-bold text-slate-900">
                    {Math.round(
                      (customBreakdown.supportWeightKg + customBreakdown.hardwareWeightKg) * 10
                    ) / 10}{' '}
                    kg
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3">
                <div>
                  <span className="text-xs text-slate-500">कुल अनुमानित वजन:</span>
                  <p className="text-lg font-bold text-slate-900">
                    ~{customBreakdown.totalWeightKg} kg
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">अनुमानित लागत (@ ₹110/kg):</span>
                  <p className="text-xl font-bold text-orange-600">
                    {money(customPricing.priceMinor)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700">
                <Link
                  href={`/contact?requirement=${encodeURIComponent(
                    `मुझे ${hFeet}x${wFeet} फीट (~${customBreakdown.totalWeightKg} kg) सादे दरवाजे की पक्की कोटेशन चाहिए।`
                  )}`}
                >
                  इस नाप की कोटेशन मांगें <ArrowRight size={14} />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Customisation Options */}
      {options.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-bold text-slate-900">
            कस्टमाइजेशन व फिटिंग विकल्प (Customisation Choices)
          </h2>
          <ul className="space-y-2">
            {options.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs"
              >
                <span className="font-medium text-slate-800">
                  {o.option_group}: {o.name}
                  {preview ? ` (${o.status})` : ''}
                </span>
                <span className="font-semibold text-slate-700">
                  {o.extra_cost_minor
                    ? `अनुमानित +${money(o.extra_cost_minor)}`
                    : 'वर्कशॉप से चर्चा करें'}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-slate-500">
            * विकल्प और वेरिएंट कीमतें अनुमानित हैं। कारीगर द्वारा साइट पर नाप लेने के बाद पक्की कोटेशन दी जाती है।
          </p>
        </div>
      )}
    </section>
  );
}
