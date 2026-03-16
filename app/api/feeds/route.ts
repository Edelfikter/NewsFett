import { NextRequest, NextResponse } from 'next/server';
import { addFeed, getFeeds } from '@/lib/redis';

export const runtime = 'nodejs';

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const feeds = await getFeeds();
    return NextResponse.json({ feeds });
  } catch (err) {
    console.error('[GET /api/feeds]', err);
    return NextResponse.json({ error: 'Failed to load feeds' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = typeof body?.url === 'string' ? body.url.trim() : '';

    if (!url || !isValidUrl(url)) {
      return NextResponse.json({ error: 'Invalid feed URL' }, { status: 400 });
    }

    await addFeed(url);
    return NextResponse.json({ ok: true, url }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/feeds]', err);
    return NextResponse.json({ error: 'Failed to save feed' }, { status: 500 });
  }
}
