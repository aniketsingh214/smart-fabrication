import { expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/'
}));
import { LocaleProvider } from '@/lib/i18n/locale-context';
import {
  cosineSimilarity,
  computeTextRelevance,
  createProductVisualEmbedding,
  DEFAULT_CATALOG_ITEMS
} from '@/features/search/visual-engine';
import {
  UnifiedSearchModal,
  FEATURED_CATEGORIES
} from '@/features/search/unified-search-modal';
import { PortfolioShowcase, PORTFOLIO_ITEMS } from '@/features/home/portfolio-showcase';

it('computes mathematical cosine similarity and visual vector embeddings correctly', () => {
  const v1 = [1, 0, 0, 0];
  const v2 = [1, 0, 0, 0];
  const v3 = [0, 1, 0, 0];

  expect(cosineSimilarity(v1, v2)).toBeCloseTo(1.0, 5);
  expect(cosineSimilarity(v1, v3)).toBeCloseTo(0.5, 5); // Clamped (dot + 1) / 2

  const embedding1 = createProductVisualEmbedding({
    darkness: 0.9,
    edgeDensity: 0.8,
    laserCutMesh: true
  });
  const embedding2 = createProductVisualEmbedding({
    darkness: 0.9,
    edgeDensity: 0.8,
    laserCutMesh: true
  });
  const embeddingGold = createProductVisualEmbedding({
    darkness: 0.2,
    edgeDensity: 0.4,
    goldenFinish: true
  });

  expect(cosineSimilarity(embedding1, embedding2)).toBeCloseTo(1.0, 4);
  expect(cosineSimilarity(embedding1, embeddingGold)).toBeLessThan(0.95);
});

it('calculates text query relevance across products', () => {
  const item = DEFAULT_CATALOG_ITEMS[0]; // Modern Laser Cut Double Swing Gate
  expect(computeTextRelevance('laser cut', item)).toBe(1.0);
  expect(computeTextRelevance('swing gate', item)).toBe(1.0);
  expect(computeTextRelevance('completely unrelated term', item)).toBe(0);
});

it('includes all 10 featured discovery categories in UnifiedSearchModal', () => {
  const categoryNames = FEATURED_CATEGORIES.map((c) => c.nameEn);

  expect(categoryNames).toContain('1. Main Steel Gates');
  expect(categoryNames).toContain('2. Laser Cut Gates');
  expect(categoryNames).toContain('3. Double Door Gates');
  expect(categoryNames).toContain('4. Sliding Gates');
  expect(categoryNames).toContain('5. Modern Gate Designs');
  expect(categoryNames).toContain('6. Balcony Railings');
  expect(categoryNames).toContain('7. Stainless Steel Railings');
  expect(categoryNames).toContain('8. Window Grills');
  expect(categoryNames).toContain('9. Metal Doors');
  expect(categoryNames).toContain('10. Decorative Metal Designs');
});

it('renders UnifiedSearchModal with camera and gallery visual search controls and product cards', () => {
  const html = renderToStaticMarkup(
    <LocaleProvider initialLocale="en">
      <UnifiedSearchModal isOpen={true} onClose={() => {}} />
    </LocaleProvider>
  );

  // Search input & controls
  expect(html).toContain('aria-label="Camera visual search"');
  expect(html).toContain('aria-label="Gallery visual search"');
  expect(html).toContain('type="file"');
  expect(html).toContain('capture="environment"');

  // Featured Categories
  expect(html).toContain('Main Steel Gates');
  expect(html).toContain('Laser Cut Gates');
  expect(html).toContain('Balcony Railings');

  // Product cards
  expect(html).toContain('Modern Laser Cut Double Swing Gate');
  expect(html).toContain('₹35,000');
  expect(html).toContain('Details');
  expect(html).toContain('Quote');
});

it('renders PortfolioShowcase with 6 categories and exact required heading & introductory text', () => {
  const html = renderToStaticMarkup(
    <LocaleProvider initialLocale="en">
      <PortfolioShowcase />
    </LocaleProvider>
  );

  // Heading & introductory text
  expect(html).toContain('A Look at Our Work');
  expect(html).toContain(
    'Every gate has its own design, purpose and personality. Explore our work and find inspiration for your space.'
  );

  // 6 Categories
  expect(PORTFOLIO_ITEMS).toHaveLength(6);
  const titles = PORTFOLIO_ITEMS.map((p) => p.titleEn);
  expect(titles).toContain('Modern Main Gates');
  expect(titles).toContain('CNC Laser Cut Designs');
  expect(titles).toContain('Luxury Sliding Gates');
  expect(titles).toContain('Steel Gate Fabrication');
  expect(titles).toContain('Balcony Railings');
  expect(titles).toContain('Custom Metal Designs');

  // CTA Link to catalog
  expect(html).toContain('Explore Our Designs');
  expect(html).toContain('href="/catalog"');
});

it('renders PortfolioShowcase in Hindi when locale is hi', () => {
  const html = renderToStaticMarkup(
    <LocaleProvider initialLocale="hi">
      <PortfolioShowcase />
    </LocaleProvider>
  );

  expect(html).toContain('हमारे काम की एक झलक');
  expect(html).toContain(
    'हर गेट का अपना डिज़ाइन, उद्देश्य और पहचान होती है। हमारे काम को देखें और अपने घर के लिए प्रेरणा पाएं।'
  );
  expect(html).toContain('मॉडर्न मेन गेट्स');
  expect(html).toContain('सीएनसी लेज़र कट डिज़ाइन्स');
});
