import { NextRequest, NextResponse } from 'next/server';
import { getRecentItems } from '@/lib/redis';
import { MOCK_ITEMS } from '@/lib/mockData';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const sinceStr = req.nextUrl.searchParams.get('since');
  const since = sinceStr ? parseInt(sinceStr, 10) : Date.now() - 60 * 60 * 1000;

  // Try Redis first; fall back to mock data
  try {
    const items = await getRecentItems(since);
    // If we have real items, return them
    if (items.length > 0) {
      return NextResponse.json(items);
    }
  } catch {
    // Redis not configured — fall through to mock
  }

  // Return mock data filtered by since
  const mockFiltered = MOCK_ITEMS.filter((it) => it.publishedAt > since);
  return NextResponse.json(mockFiltered);
}
