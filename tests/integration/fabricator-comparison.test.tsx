import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FabricatorComparison } from '@/components/fabricator-comparison';
import { LocaleProvider } from '@/lib/i18n/locale-context';

it('renders the GateWala Quality & Services section in Hindi with required copy and structure', () => {
  const html = renderToStaticMarkup(
    <LocaleProvider initialLocale="hi">
      <FabricatorComparison phone="+91 98765 43210" whatsapp="919876543210" />
    </LocaleProvider>
  );

  // 1. Heading replaced
  expect(html).toContain('GateWala');
  expect(html).toContain('ही क्यों चुनें?');
  expect(html).not.toContain('हम बनाम सड़क किनारे की आम वेल्डिंग दुकान');
  expect(html).not.toContain('आम वेल्डिंग दुकान');

  // 2. Exact required description
  expect(html).toContain('जानिए कैसे बेहतर मटेरियल, मजबूत वेल्डिंग और शानदार डिजाइन आपके घर को सुरक्षित और खूबसूरत बनाते हैं।');

  // 3. Negative comparison removed
  expect(html).not.toContain('कच्ची इलेक्ट्रिक वेल्डिंग');
  expect(html).not.toContain('सस्ता लाल प्राइमर');
  expect(html).not.toContain('अंदाज का नाप');

  // 4. 6 required quality & service areas included
  expect(html).toContain('मटेरियल क्वालिटी');
  expect(html).toContain('कस्टम डिज़ाइन');
  expect(html).toContain('वेल्डिंग और फिनिशिंग');
  expect(html).toContain('पारदर्शी कोटेशन');
  expect(html).toContain('घर पर नाप और फिटिंग');
  expect(html).toContain('कस्टमर सपोर्ट और सहायता');

  // 5. Grounded, verified claims without unsupported 100% pure claims
  expect(html).not.toContain('100% टाटा / जिंदल');
  expect(html).not.toContain('100% पक्की गारंटी');
  expect(html).toContain('भरोसेमंद सेवा व उचित दाम');

  // 6. Action buttons and contact links
  expect(html).toContain('tel:+919876543210');
  expect(html).toContain('https://wa.me/919876543210');
});

it('renders the GateWala Quality & Services section in English when locale is set to en', () => {
  const html = renderToStaticMarkup(
    <LocaleProvider initialLocale="en">
      <FabricatorComparison phone="+91 98765 43210" whatsapp="919876543210" />
    </LocaleProvider>
  );

  // English Heading & Subtitle
  expect(html).toContain('Why Choose');
  expect(html).toContain('GateWala?');
  expect(html).toContain('Discover how quality materials, durable welding, and modern designs keep your home secure and beautiful.');

  // English 6 Areas
  expect(html).toContain('Material Quality');
  expect(html).toContain('Custom Designs');
  expect(html).toContain('Welding &amp; Finishing');
  expect(html).toContain('Transparent Quotation');
  expect(html).toContain('Installation &amp; Fitting');
  expect(html).toContain('Customer Support');

  // Grounded claims in English
  expect(html).toContain('Trusted Service &amp; Honest Pricing');
  expect(html).toContain('Chat on WhatsApp');
});
