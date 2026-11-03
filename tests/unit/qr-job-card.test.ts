import { describe, it, expect } from 'vitest';
import { generateQrDataUrl, generateQrSvg } from '@/lib/qrcode/service';

describe('QR code generator service', () => {
  it('generates a valid data URL PNG for live order tracking', async () => {
    const trackingUrl = 'https://smartfabrication.vercel.app/account/orders/c5e62cb8-a704-44aa-a6e5-47209ff89a01';
    const dataUrl = await generateQrDataUrl(trackingUrl);

    expect(dataUrl).toBeDefined();
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(dataUrl.length).toBeGreaterThan(100);
  });

  it('generates a valid SVG string for printable workshop cards', async () => {
    const jobCardUrl = 'https://smartfabrication.vercel.app/admin/orders/c5e62cb8-a704-44aa-a6e5-47209ff89a01/job-card';
    const svg = await generateQrSvg(jobCardUrl);

    expect(svg).toBeDefined();
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.includes('</svg>')).toBe(true);
    expect(svg.includes('viewBox=')).toBe(true);
  });
});
