import { describe, it, expect } from 'vitest';
import {
  getBilingualProductName,
  getCategoryDisplayName,
  getBilingualMaterial,
  expandSearchQuery
} from '@/lib/i18n/catalog-bilingual';
import { getMilestoneInfo } from '@/lib/i18n/order-milestones';
import { hi } from '@/lib/i18n/dictionaries/hi';
import { en } from '@/lib/i18n/dictionaries/en';

describe('Localization System', () => {
  describe('Dictionary completeness', () => {
    it('contains identical top-level keys in Hindi and English dictionaries', () => {
      const hiKeys = Object.keys(hi).sort();
      const enKeys = Object.keys(en).sort();
      expect(hiKeys).toEqual(enKeys);
    });

    it('contains matching keys in nav and common sections', () => {
      expect(Object.keys(hi.nav).sort()).toEqual(Object.keys(en.nav).sort());
      expect(Object.keys(hi.common).sort()).toEqual(Object.keys(en.common).sort());
      expect(Object.keys(hi.calculator).sort()).toEqual(Object.keys(en.calculator).sort());
      expect(Object.keys(hi.enquiry).sort()).toEqual(Object.keys(en.enquiry).sort());
      expect(Object.keys(hi.order).sort()).toEqual(Object.keys(en.order).sort());
    });
  });

  describe('Bilingual Catalog Helpers', () => {
    it('formats bilingual product names with Hindi first in Hindi mode', () => {
      const name = getBilingualProductName('Modern Steel Gate #42', 'hi');
      expect(name).toContain('स्टील का मेन गेट');
      expect(name).toContain('Modern Steel Gate #42');
    });

    it('returns raw product name in English mode without unnecessary prefix', () => {
      const name = getBilingualProductName('Modern Steel Gate #42', 'en');
      expect(name).toBe('Modern Steel Gate #42');
    });

    it('translates material names accurately', () => {
      expect(getBilingualMaterial('Stainless Steel 304', 'hi')).toContain('स्टेनलेस स्टील');
      expect(getBilingualMaterial('Mild Steel', 'hi')).toContain('लोहा');
      expect(getBilingualMaterial('Wrought Iron', 'hi')).toContain('गढ़ा लोहा');
      expect(getBilingualMaterial('Stainless Steel 304', 'en')).toBe('Stainless Steel 304');
    });

    it('translates category slugs to rural-friendly names', () => {
      expect(getCategoryDisplayName('main-gates', 'Main Gates', 'hi')).toContain('मुख्य गेट');
      expect(getCategoryDisplayName('railings', 'Railings', 'hi')).toContain('रेलिंग');
      expect(getCategoryDisplayName('window-grills', 'Window Grills', 'hi')).toContain('खिड़की की जाली');
      expect(getCategoryDisplayName('rolling-shutters', 'Rolling Shutters', 'hi')).toContain('दुकान का शटर');
      expect(getCategoryDisplayName('industrial-sheds', 'Sheds', 'hi')).toContain('शेड और छत');
      expect(getCategoryDisplayName('main-gates', 'Main Gates', 'en')).toContain('Main Gates');
    });

    it('expands Hindi search queries to match database English keywords', () => {
      expect(expandSearchQuery('गेट')).toContain('gate');
      expect(expandSearchQuery('जाली')).toContain('grill');
      expect(expandSearchQuery('रेलिंग')).toContain('railing');
      expect(expandSearchQuery('लोहा')).toContain('iron');
      expect(expandSearchQuery('स्टील')).toContain('steel');
      expect(expandSearchQuery('शटर')).toContain('shutter');
      expect(expandSearchQuery('custom search')).toContain('custom search');
    });
  });

  describe('Order Milestones Mapping', () => {
    it('maps CONFIRMED to Stage 1 (Order Placed)', () => {
      const info = getMilestoneInfo('CONFIRMED', 'hi');
      expect(info.stageNumber).toBe(1);
      expect(info.label).toBe('1. ऑर्डर मिल गया');
    });

    it('maps MEASUREMENT_CONFIRMED to Stage 2 (Measurement Verified)', () => {
      const info = getMilestoneInfo('MEASUREMENT_CONFIRMED', 'hi');
      expect(info.stageNumber).toBe(2);
      expect(info.label).toBe('2. नाप की जाँच पूरी');
    });

    it('maps PRODUCTION_STARTED to Stage 3 (Fabrication Started)', () => {
      const info = getMilestoneInfo('PRODUCTION_STARTED', 'hi');
      expect(info.stageNumber).toBe(3);
      expect(info.label).toBe('3. काम शुरू हो गया (कटिंग व वेल्डिंग)');
    });

    it('maps READY to Stage 4 (Ready for Dispatch)', () => {
      const info = getMilestoneInfo('READY', 'hi');
      expect(info.stageNumber).toBe(4);
      expect(info.label).toBe('4. आपका सामान तैयार है');
    });

    it('maps OUT_FOR_DELIVERY to Stage 5 (Out for Delivery)', () => {
      const info = getMilestoneInfo('OUT_FOR_DELIVERY', 'hi');
      expect(info.stageNumber).toBe(5);
      expect(info.label).toBe('5. डिलीवरी के लिए निकला');
    });

    it('maps INSTALLATION to Stage 6 (On-Site)', () => {
      const info = getMilestoneInfo('INSTALLATION', 'hi');
      expect(info.stageNumber).toBe(6);
      expect(info.label).toBe('6. सामान पहुँच गया (फिटिंग जारी)');
    });

    it('maps COMPLETED to Stage 7 (Completed)', () => {
      const info = getMilestoneInfo('COMPLETED', 'hi');
      expect(info.stageNumber).toBe(7);
      expect(info.label).toBe('7. काम पूरा हो गया ✓');
    });

    it('maps CANCELLED to Stage 0 with cancelled status', () => {
      const info = getMilestoneInfo('CANCELLED', 'hi');
      expect(info.stageNumber).toBe(0);
      expect(info.label).toBe('ऑर्डर रद्द किया गया');
    });
  });
});
