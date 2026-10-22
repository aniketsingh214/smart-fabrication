import { estimateSchema } from '@/contracts/estimates';
import demoImages from '@/content/demo-images.json';
import { z } from 'zod';
import { catalogConfiguration } from '@/features/catalog/configuration';
import { EnquiryForm } from '@/features/leads/enquiry-form';
import { serverClient } from '@/lib/supabase/server';
import { Phone, MessageCircle, Clock, MapPin } from 'lucide-react';

export const metadata = {
  title: 'हमसे बात करें | कोटेशन मांगें | Contact SmartFabrication',
  description: 'गेट, रेलिंग और जाली बनवाने के लिए अपनी नाप भेजें या सीधे कॉल व WhatsApp पर बात करें।'
};

export default async function Contact({
  searchParams
}: {
  searchParams: Promise<{
    product?: string;
    inspiration?: string;
    width_mm?: string;
    height_mm?: string;
    requirement?: string;
  }>;
}) {
  const { product, inspiration, width_mm, height_mm, requirement } = await searchParams;
  const demo = demoImages.find(image => image.key === inspiration);
  let initialRequirement =
    requirement ||
    (demo
      ? `I would like to discuss a custom project inspired by "${demo.title}". Reference photo: ${demo.source}\nPlease help confirm suitable materials, dimensions and installation requirements.`
      : undefined);
  const dimensions = estimateSchema.safeParse({
    product_id: product,
    width_mm: Number(width_mm),
    height_mm: Number(height_mm)
  });
  if (!initialRequirement && dimensions.success) {
    initialRequirement =
      'I would like an exact quotation for ' +
      dimensions.data.width_mm +
      ' mm × ' +
      dimensions.data.height_mm +
      ' mm. These dimensions are indicative and require workshop verification.';
  }

  const db = await serverClient();
  let choices: Awaited<ReturnType<typeof catalogConfiguration>> | undefined;
  if (product && z.uuid().safeParse(product).success) {
    const { data: available } = await db
      .from('products')
      .select('id')
      .eq('id', product)
      .eq('status', 'published')
      .maybeSingle();
    if (available) choices = await catalogConfiguration(db, available.id);
  }

  const { data: settings } = await db
    .from('site_settings')
    .select('name,value')
    .eq('public', true)
    .in('name', ['phone', 'address', 'service_cities', 'hours']);

  const phoneSetting = settings?.find(s => s.name === 'phone')?.value || '+91 98765 43210';
  const rawPhone = phoneSetting.replace(/[^0-9]/g, '');

  const steps = [
    { hi: 'अपनी पसंद या नाप बताएं', en: 'Share your requirement' },
    { hi: 'घर आकर सही नाप और मटीरियल तय होगा', en: 'Confirm dimensions and measurement' },
    { hi: 'पक्का कोटेशन और बिल देखें', en: 'Review your exact quotation' }
  ];

  return (
    <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 lg:grid-cols-[1fr_1.4fr] lg:px-8">
      <div>
        <p className="eyebrow text-orange-600">सीधे वर्कशॉप से बात करें · Start your project</p>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-slate-900">
          आपको क्या बनवाना है?<br />
          <span className="text-orange-600">हमें बताएं या कॉल करें</span>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
          चाहे नया लोहे का मेन गेट हो, मजबूत खिड़की की जाली या छत की स्टील रेलिंग — हमें अपनी पसंद बताएं। हम सही नाप, लोहा/स्टील की क्वालिटी और पक्का खर्च बताएंगे।
        </p>

        {/* Quick Call / WhatsApp Bar for rural visitors */}
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`tel:${phoneSetting}`}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 transition"
          >
            <Phone size={16} />
            <span>कॉल करें: {phoneSetting}</span>
          </a>
          <a
            href={`https://wa.me/${rawPhone}?text=${encodeURIComponent('नमस्ते SmartFabrication, मुझे गेट/रेलिंग बनवाने के बारे में जानकारी चाहिए।')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <MessageCircle size={16} />
            <span>WhatsApp करें</span>
          </a>
        </div>

        <ol className="mt-8 space-y-4">
          {steps.map((s, i) => (
            <li className="flex items-center gap-3 text-sm text-slate-700" key={s.en}>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-slate-900">{s.hi}</p>
                <p className="text-xs text-slate-400">{s.en}</p>
              </div>
            </li>
          ))}
        </ol>

        {settings && settings.length > 0 && (
          <div className="mt-8 space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">कारखाना संपर्क (Workshop Details)</h3>
            {settings.map(s => (
              <div key={s.name}>
                <p className="text-xs font-semibold text-slate-600 capitalize">{s.name.replaceAll('_', ' ')}</p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-900">{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <section className="card p-6 sm:p-8">
        <h2 className="mb-6 text-xl font-bold text-slate-900" aria-label="Request a quotation">
          कोटेशन के लिए जानकारी भेजें{' '}
          <span className="block text-xs font-normal text-slate-500 mt-0.5">(Request a quotation)</span>
        </h2>
        <EnquiryForm
          initialRequirement={initialRequirement}
          product={choices?.id}
          variants={choices?.product_variants}
          options={choices?.product_options}
        />
      </section>
    </div>
  );
}


