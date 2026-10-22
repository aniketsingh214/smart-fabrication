import { describe, it, expect } from 'vitest';

describe('Shop & Cart calculation and formatting', () => {
  it('calculates subtotal and item quantities accurately', () => {
    const cart = [
      {
        id: 'item_1',
        product_id: 'prod_1',
        name: 'Royal Stainless Steel Main Gate',
        slug: 'royal-ss-gate',
        material: 'Stainless Steel',
        price_min_minor: 4500000, // ₹45,000.00
        quantity: 2
      },
      {
        id: 'item_2',
        product_id: 'prod_2',
        name: 'Glass Balcony Railing',
        slug: 'glass-railing',
        material: 'Stainless Steel & Glass',
        price_min_minor: 1200000, // ₹12,000.00
        quantity: 3
      }
    ];

    const totalQty = cart.reduce((sum, i) => sum + i.quantity, 0);
    const subtotalMinor = cart.reduce((sum, i) => sum + (i.price_min_minor ?? 0) * i.quantity, 0);

    expect(totalQty).toBe(5);
    expect(subtotalMinor).toBe(4500000 * 2 + 1200000 * 3); // 90,000 + 36,000 = 126,000 (12600000 minor)
    expect(subtotalMinor).toBe(12600000);
  });

  it('formats combined quotation requirement message properly', () => {
    const cart = [
      {
        name: 'Royal Stainless Steel Main Gate',
        material: 'Stainless Steel',
        quantity: 1,
        dimensions: { display: '10 ft × 7 ft' }
      },
      {
        name: 'SS Window Grill',
        material: 'Steel',
        quantity: 4
      }
    ];

    const requirementText = cart
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.name} (${item.material}) × ${item.quantity} unit(s)` +
          (item.dimensions?.display ? ` [Size: ${item.dimensions.display}]` : '')
      )
      .join('\n');

    expect(requirementText).toContain('1. Royal Stainless Steel Main Gate (Stainless Steel) × 1 unit(s) [Size: 10 ft × 7 ft]');
    expect(requirementText).toContain('2. SS Window Grill (Steel) × 4 unit(s)');
  });
});
