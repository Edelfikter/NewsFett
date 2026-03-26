import { NextResponse } from 'next/server';
import { getFeeds } from '@/lib/redis';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const feeds = await getFeeds();
    return NextResponse.json({ feeds });
  } catch (err) {
    console.error('[GET /api/feeds]', err);
    return NextResponse.json({ error: 'Failed to load feeds' }, { status: 500 });
  }
}
