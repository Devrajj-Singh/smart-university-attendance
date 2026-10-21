import { NextRequest, NextResponse } from 'next/server';
import { generateQrSvg, generateQrDataUrl } from '@/lib/qr';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const format = searchParams.get('format') || 'svg';
    const width = parseInt(searchParams.get('width') || '280', 10);

    if (!text) {
      return NextResponse.json({ error: 'Text query parameter is required' }, { status: 400 });
    }

    if (format === 'dataurl') {
      const dataUrl = await generateQrDataUrl(text, { width });
      return NextResponse.json({ success: true, dataUrl });
    }

    const svg = await generateQrSvg(text, { width });
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    console.error('[API/QR] Error generating QR code:', err);
    return NextResponse.json({ error: err.message || 'QR generation failed' }, { status: 500 });
  }
}
