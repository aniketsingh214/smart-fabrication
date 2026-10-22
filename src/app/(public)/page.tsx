import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ArrowUpRight,
  Ruler,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Calculator,
  Phone,
  Layers,
  Award,
  Shield,
  Compass,
  FileCheck,
  ChevronRight,
  Building2,
  Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoHeroPhoto } from '@/components/demo-photography';
import { serverClient } from '@/lib/supabase/server';
import { CategoryCards } from '@/features/catalog/category-cards';
import { FeaturedProducts } from '@/features/catalog/featured-products';

export default async function Home() {
  const db = await serverClient();

  // Fetch sections and hero from database
  const [{ data: sections }, { data: hero }, { count: totalProductsCount }] = await Promise.all([
    db
      .from('website_sections')
      .select('id,heading,body,name')
      .eq('status', 'published')
      .neq('name', 'hero')
      .order('sort_order')
      .order('id')
      .limit(8),
    db
      .from('website_sections')
      .select('heading,body')
      .eq('status', 'published')
      .eq('name', 'hero')
      .order('sort_order')
      .order('id')
      .limit(1)
      .maybeSingle(),
    db
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
  ]);

  const totalDesigns = totalProductsCount ?? 315;

  return (
    <div className="relative overflow-hidden bg-slate-50/50">
      {/* 1. ARCHITECTURAL LUXURY HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-24 lg:py-28">
        {/* Subtle Ambient Radial Lighting */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[1000px] rounded-full bg-gradient-to-b from-orange-600/20 via-orange-500/10 to-transparent blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:32px_32px]"
        />

        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            {/* Hero Left Content */}
            <div>
              {/* Premium Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold text-orange-400 backdrop-blur-md">
                <Sparkles size={13} className="text-orange-400" />
                <span>Premium Architectural Metalcraft & Structural Fabrication</span>
              </div>

              {/* Main Headline */}
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white leading-[1.1]">
                {hero?.heading ?? (
                  <>
                    Engineering Strength.
                    <br />
                    Elevating Spaces.
                    <br />
                    <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                      Built to Exact Measure.
                    </span>
                  </>
                )}
              </h1>

              {/* Subtitle */}
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                {hero?.body ??
                  'Bespoke main gates, stainless steel & glass railings, CNC laser safety grills, and heavy structural fabrication. Measured with digital precision, engineered with Jindal SS 304, and erected for generations.'}
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-500 text-white font-semibold shadow-lg shadow-orange-600/25 border-0">
                  <Link href="/catalog" className="flex items-center gap-2">
                    Explore {totalDesigns}+ Designs <ArrowRight size={17} />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-slate-800 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white"
                >
                  <Link href="/estimate" className="flex items-center gap-2">
                    <Calculator size={16} className="text-orange-400" />
                    Instant Price Calculator
                  </Link>
                </Button>
              </div>

              {/* Quick Category Chips */}
              <div className="mt-8 border-t border-slate-800/80 pt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Quick Design Categories:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/catalog?category=main-gates"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-orange-500/50 hover:bg-slate-800 hover:text-white"
                  >
                    <span>🚪 Main Gates (75+ Designs)</span>
                    <ChevronRight size={12} className="text-slate-500" />
                  </Link>
                  <Link
                    href="/catalog?category=railings"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-orange-500/50 hover:bg-slate-800 hover:text-white"
                  >
                    <span>🪜 Railings & Balusters (74+ Designs)</span>
                    <ChevronRight size={12} className="text-slate-500" />
                  </Link>
                  <Link
                    href="/catalog?category=window-grills"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-orange-500/50 hover:bg-slate-800 hover:text-white"
                  >
                    <span>🪟 Safety Window Grills (76+ Designs)</span>
                    <ChevronRight size={12} className="text-slate-500" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Hero Right Visual & Stat Collage */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl shadow-black/60">
                <DemoHeroPhoto />
              </div>

              {/* Floating Stat Card 1: Tolerances */}
              <div className="absolute -top-4 -left-4 hidden sm:flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/90 p-3 shadow-xl backdrop-blur-md">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400">
                  <Ruler size={18} />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">±0.5 mm CAD Precision</p>
                  <p className="text-[10px] text-slate-400">Digital on-site laser leveling</p>
                </div>
              </div>

              {/* Floating Stat Card 2: Material Certified */}
              <div className="absolute -bottom-6 -right-4 hidden sm:flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 shadow-xl backdrop-blur-md">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">100% Jindal SS 304 Certified</p>
                  <p className="text-[10px] text-slate-400">Anti-rust & weather resistant</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Bottom Trust Metrics Strip */}
          <div className="mt-14 grid grid-cols-2 gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-md sm:grid-cols-4 sm:p-7">
            <div className="border-r border-slate-800/80 pr-4 last:border-0 sm:last:border-r-0">
              <p className="text-2xl font-bold text-white sm:text-3xl">{totalDesigns}+</p>
              <p className="mt-1 text-xs text-slate-400">Published Designs In Catalogue</p>
            </div>
            <div className="border-r-0 sm:border-r border-slate-800/80 pr-4">
              <p className="text-2xl font-bold text-orange-400 sm:text-3xl">100%</p>
              <p className="mt-1 text-xs text-slate-400">Custom Sizing (Feet / Inch / mm)</p>
            </div>
            <div className="border-r border-slate-800/80 pr-4 last:border-0 sm:last:border-r-0">
              <p className="text-2xl font-bold text-white sm:text-3xl">SS-304 & MS</p>
              <p className="mt-1 text-xs text-slate-400">Authentic Heavy-Gauge Steel</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400 sm:text-3xl">7–10 Days</p>
              <p className="mt-1 text-xs text-slate-400">Fast Fabrication & Site Erection</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INSTANT ESTIMATE TEASER BANNER */}
      <section className="mx-auto max-w-7xl px-5 pt-8 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100/70 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-md shadow-orange-600/20">
                <Calculator size={24} />
              </span>
              <div>
                <span className="inline-block rounded-md bg-orange-600/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-orange-700">
                  Self-Service Estimation
                </span>
                <h2 className="mt-1.5 text-xl font-bold text-slate-900 sm:text-2xl">
                  Know your project cost in under 30 seconds
                </h2>
                <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-slate-600">
                  Select your design and enter dimensions in <strong>Feet + Inches</strong>, <strong>Decimal Feet</strong>, <strong>Inches</strong>, or <strong>Millimeters</strong>. View live material breakdown and approximate workshop pricing.
                </p>
              </div>
            </div>
            <Button asChild size="lg" className="shrink-0 bg-slate-900 text-white hover:bg-slate-800 shadow-md">
              <Link href="/estimate" className="flex items-center gap-2">
                Open Price Calculator <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 3. BENTO GRID: CRAFTSMANSHIP & ENGINEERING EXCELLENCE */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="mb-10 text-center">
          <p className="eyebrow text-orange-600">The Smart Fabrication Standard</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Why Our Metalwork Stands Apart
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500">
            From certified raw alloy sections to computer-controlled CNC profiling and chemical anti-rust priming, every stage is engineered for lasting architectural beauty.
          </p>
        </div>

        {/* Bento Grid Container */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Bento Card 1: Prime Steel Metallurgy (Large Card) */}
          <div className="card group relative overflow-hidden p-7 transition hover:border-orange-300 hover:shadow-lg lg:col-span-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition">
              <Award size={22} />
            </div>
            <h3 className="mt-5 text-xl font-bold text-slate-900">
              Grade 304 & 316 Stainless Steel + Heavy MS Sections
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-600 max-w-xl">
              We never compromise on wall thickness. Authentic Jindal Stainless pipes, solid square bars, and structural mild steel channels ensure high impact resistance and zero sagging over decades of use.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-100">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                <CheckCircle2 size={13} className="text-orange-600" /> Zero Scrap Metal Policy
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                <CheckCircle2 size={13} className="text-orange-600" /> Multi-Stage Anti-Rust Priming
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                <CheckCircle2 size={13} className="text-orange-600" /> Satin Hairline & Mirror Polish
              </span>
            </div>
          </div>

          {/* Bento Card 2: CNC Laser & TIG Welding */}
          <div className="card group p-7 transition hover:border-orange-300 hover:shadow-lg">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition">
              <Sparkles size={22} />
            </div>
            <h3 className="mt-5 text-xl font-bold text-slate-900">
              CNC Laser & Argon TIG Welding
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
              High-precision fiber laser cutting produces clean geometric motifs without burrs. Continuous TIG welding ground flush creates smooth, invisible structural joints.
            </p>
          </div>

          {/* Bento Card 3: Digital On-Site Measurement */}
          <div className="card group p-7 transition hover:border-orange-300 hover:shadow-lg">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition">
              <Compass size={22} />
            </div>
            <h3 className="mt-5 text-xl font-bold text-slate-900">
              Laser Sizing & CAD Accuracy
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
              Every site has subtle slope or plumb variations. Our technicians take accurate laser measurements before workshop production begins, avoiding on-site hacking.
            </p>
          </div>

          {/* Bento Card 4: Complete Installation & Turnkey Service (Large Card) */}
          <div className="card group relative overflow-hidden p-7 transition hover:border-orange-300 hover:shadow-lg lg:col-span-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition">
              <Wrench size={22} />
            </div>
            <h3 className="mt-5 text-xl font-bold text-slate-900">
              Heavy Structural Anchor Fastening & Smooth Hardware
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-600 max-w-xl">
              From heavy-duty ball-bearing bottom rollers and stainless steel hinges to hardened chemical anchor bolts, our installation team ensures your gates and railings glide smoothly and lock securely.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-100">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                <CheckCircle2 size={13} className="text-orange-600" /> Ball-Bearing Hinge Mechanisms
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                <CheckCircle2 size={13} className="text-orange-600" /> Toughened 12mm Glass Hardware
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                <CheckCircle2 size={13} className="text-orange-600" /> Turnkey Safe Site Erection
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS (Verified by integration tests) */}
      <FeaturedProducts />

      {/* 5. CATEGORIES BENTO EXPLORER (Verified by integration tests) */}
      <CategoryCards />

      {/* 6. TRANSPARENT 4-STEP WORKING PROCESS */}
      <section className="bg-slate-900 text-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="eyebrow text-orange-400">Predictable & Transparent</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              From Concept to Secure Installation
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              A smooth 4-stage process with itemized bill of materials and zero surprise costs.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '01',
                title: 'Select Design',
                desc: 'Browse our 315+ models or upload your architectural CAD reference.'
              },
              {
                step: '02',
                title: 'Enter Dimensions',
                desc: 'Input size in Feet, Inches, or Millimeters to see an instant approximate estimate.'
              },
              {
                step: '03',
                title: 'Laser Measurement',
                desc: 'Our technician visits your site to verify dimensions and confirm the fixed quotation.'
              },
              {
                step: '04',
                title: 'Workshop Erection',
                desc: 'Fabricated with prime steel and installed safely by our trained structural team.'
              }
            ].map(item => (
              <div
                key={item.step}
                className="relative rounded-2xl border border-slate-800 bg-slate-950/60 p-6 backdrop-blur-md transition hover:border-orange-500/50"
              >
                <span className="text-3xl font-extrabold text-orange-500/80">{item.step}</span>
                <h3 className="mt-3 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. HIGH-CONVERSION CTA & CONSULTATION BANNER */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-12 text-white shadow-2xl sm:px-12 sm:py-16 md:flex md:items-center md:justify-between">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-orange-600/20 blur-3xl"
          />

          <div className="relative max-w-xl">
            <span className="inline-block rounded-full bg-orange-500/20 px-3.5 py-1 text-xs font-semibold text-orange-400">
              Free Site Measurement Consultation
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Have a custom project in mind?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Speak with our senior fabrication engineers today. Whether it is a single entrance gate or an entire residential building railing package, we will provide expert guidance, design catalogues, and an itemized quotation.
            </p>
          </div>

          <div className="relative mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 md:mt-0">
            <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-500 text-white font-semibold shadow-lg shadow-orange-600/30 border-0">
              <Link href="/contact" className="flex items-center justify-center gap-2">
                Discuss Your Project <ArrowRight size={16} />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              <Link href="/catalog" className="flex items-center justify-center gap-2">
                Browse Full Catalogue <ArrowUpRight size={15} />
              </Link>
            </Button>
          </div>
        </div>

        {/* Dynamic Database Sections (if populated) */}
        {sections
          ?.filter(s => !['hero', 'about', 'process'].includes(s.name))
          .map(s => (
            <div key={s.id} className="card mt-8 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">{s.heading}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{s.body}</p>
            </div>
          ))}
      </section>
    </div>
  );
}
