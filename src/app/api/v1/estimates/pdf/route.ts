import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { failure } from '@/lib/api';
import { estimatePdf } from '@/features/estimates/estimate-pdf-document';

const estimatePdfSchema = z.object({
  productName: z.string().min(1).max(200),
  widthMm: z.number().positive(),
  heightMm: z.number().positive(),
  widthFtIn: z.string().default(''),
  heightFtIn: z.string().default(''),
  areaSqFt: z.string().default(''),
  areaSqM: z.string().default(''),
  weightKg: z.number().nonnegative().default(0),
  minMinor: z.number().positive(),
  maxMinor: z.number().positive(),
  materials: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
      amount_minor: z.number()
    })
  ).default([]),
  notice: z.string().optional()
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const json = await request.json();
    const data = estimatePdfSchema.parse(json);

    const buffer = await estimatePdf({
      ...data,
      phone: process.env.NEXT_PUBLIC_SITE_PHONE || '+91 98765 43210',
      whatsapp: process.env.NEXT_PUBLIC_SITE_WHATSAPP || '+91 98765 43210'
    });

    const safeName = data.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
    const filename = `GateWala-Estimate-${safeName || 'project'}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, private',
        'X-Request-ID': requestId
      }
    });
  } catch (error) {
    return failure(error, requestId);
  }
}
