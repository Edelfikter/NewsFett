import { NextRequest, NextResponse } from 'next/server';
import { saveNewsItem, itemExists } from '@/lib/redis';
import { fetchFeed, itemId } from '@/lib/rss';
import { resolveItemLocation } from '@/lib/geocode';
import { DEFAULT_FEEDS } from '@/lib/defaultFeeds';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_ITEMS_PER_FEED = 20;

export async function POST(req: NextRequest) {
  // Basic cron secret check
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Only poll the curated default feeds – user-added feeds are fetched
    // per-device via /api/user-feeds and never written to the global store.
    const allFeeds = DEFAULT_FEEDS;
    let saved = 0;
    let skipped = 0;

    for (const feedUrl of allFeeds) {
      try {
        const rawItems = await fetchFeed(feedUrl);
        for (const raw of rawItems.slice(0, MAX_ITEMS_PER_FEED)) {
          const id = itemId(feedUrl, raw.guid || raw.link);
          const exists = await itemExists(id);
          if (exists) {
            skipped++;
            continue;
          }

          const { lat, lon } = await resolveItemLocation(
            raw.title,
            raw.description,
            raw.geoLat,
            raw.geoLon
          );

          const sourceHost = new URL(feedUrl).hostname.replace(/^www\./, '');

          await saveNewsItem({
            id,
            title: raw.title,
            link: raw.link,
            source: raw.source || sourceHost,
            lat,
            lon,
            publishedAt: raw.publishedAt,
          });
          saved++;
        }
      } catch (err) {
        console.error(`[poll] Failed to process feed ${feedUrl}:`, err);
      }
    }

    return NextResponse.json({ ok: true, saved, skipped, feeds: allFeeds.length });
  } catch (err) {
    console.error('[POST /api/poll]', err);
    return NextResponse.json({ error: 'Poll failed' }, { status: 500 });
  }
}
