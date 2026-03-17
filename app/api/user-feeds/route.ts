import { NextRequest, NextResponse } from 'next/server';
import { fetchFeed, itemId } from '@/lib/rss';
import { resolveItemLocation } from '@/lib/geocode';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_USER_FEEDS = 10;
const MAX_ITEMS_PER_FEED = 10;

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * POST /api/user-feeds
 * Body: { feeds: string[] }
 *
 * Fetches RSS content for the given feed URLs and returns news items.
 * This endpoint intentionally does NOT write anything to Redis; items are
 * scoped to the requesting client only.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const feedUrls: unknown = body?.feeds;

    if (!Array.isArray(feedUrls)) {
      return NextResponse.json({ error: 'feeds must be an array' }, { status: 400 });
    }

    const validUrls = (feedUrls as unknown[])
      .filter((u): u is string => typeof u === 'string' && isValidUrl(u))
      .slice(0, MAX_USER_FEEDS);

    const results: {
      id: string;
      title: string;
      link: string;
      source: string;
      lat: number;
      lon: number;
      publishedAt: number;
    }[] = [];

    await Promise.allSettled(
      validUrls.map(async (feedUrl) => {
        try {
          const rawItems = await fetchFeed(feedUrl);
          const sourceHost = new URL(feedUrl).hostname.replace(/^www\./, '');

          await Promise.allSettled(
            rawItems.slice(0, MAX_ITEMS_PER_FEED).map(async (raw) => {
              const id = itemId(feedUrl, raw.guid || raw.link);
              const { lat, lon } = await resolveItemLocation(
                raw.title,
                raw.description,
                raw.geoLat,
                raw.geoLon
              );
              results.push({
                id,
                title: raw.title,
                link: raw.link,
                source: raw.source || sourceHost,
                lat,
                lon,
                publishedAt: raw.publishedAt,
              });
            })
          );
        } catch (err) {
          console.error(`[user-feeds] Failed to process feed ${feedUrl}:`, err);
        }
      })
    );

    // Sort newest-first
    results.sort((a, b) => b.publishedAt - a.publishedAt);

    return NextResponse.json(results);
  } catch (err) {
    console.error('[POST /api/user-feeds]', err);
    return NextResponse.json({ error: 'Failed to fetch user feeds' }, { status: 500 });
  }
}
