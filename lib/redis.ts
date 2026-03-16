import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
      throw new Error('REDIS_URL and REDIS_TOKEN environment variables are required');
    }
    redis = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    });
  }
  return redis;
}

export const FEEDS_KEY = 'feeds';
export const NEWS_SORTED_KEY = 'news:sorted';

// Feed management
export async function addFeed(url: string): Promise<void> {
  const r = getRedis();
  await r.sadd(FEEDS_KEY, url);
}

export async function getFeeds(): Promise<string[]> {
  const r = getRedis();
  const members = await r.smembers(FEEDS_KEY);
  return members as string[];
}

// News items
export interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: string;
  lat: number;
  lon: number;
  publishedAt: number; // Unix timestamp ms
}

export async function saveNewsItem(item: NewsItem): Promise<void> {
  const r = getRedis();
  const key = `news:${item.id}`;
  await r.hset(key, {
    title: item.title,
    link: item.link,
    source: item.source,
    lat: item.lat.toString(),
    lon: item.lon.toString(),
    publishedAt: item.publishedAt.toString(),
  });
  // Score = publishedAt for sorted retrieval
  await r.zadd(NEWS_SORTED_KEY, { score: item.publishedAt, member: item.id });
}

export async function getRecentItems(since: number, limit = 50): Promise<NewsItem[]> {
  const r = getRedis();
  // Use zrange with BYSCORE option (Upstash Redis API)
  const ids = await r.zrange(NEWS_SORTED_KEY, since, '+inf', {
    byScore: true,
    count: limit,
    offset: 0,
  });
  if (!ids || ids.length === 0) return [];

  const items: NewsItem[] = [];
  for (const id of ids) {
    const hash = await r.hgetall(`news:${id}`);
    if (hash) {
      items.push({
        id: id as string,
        title: (hash.title as string) || '',
        link: (hash.link as string) || '',
        source: (hash.source as string) || '',
        lat: parseFloat((hash.lat as string) || '0'),
        lon: parseFloat((hash.lon as string) || '0'),
        publishedAt: parseInt((hash.publishedAt as string) || '0', 10),
      });
    }
  }
  return items.sort((a, b) => b.publishedAt - a.publishedAt);
}

// Geocode cache
export async function getCachedGeo(text: string): Promise<{ lat: number; lon: number } | null> {
  const r = getRedis();
  const cached = await r.get(`geo:${text}`);
  if (!cached) return null;
  const { lat, lon } = cached as { lat: number; lon: number };
  return { lat, lon };
}

export async function setCachedGeo(text: string, lat: number, lon: number): Promise<void> {
  const r = getRedis();
  // Cache for 30 days
  await r.set(`geo:${text}`, { lat, lon }, { ex: 60 * 60 * 24 * 30 });
}

// Check if item already exists (dedupe)
export async function itemExists(id: string): Promise<boolean> {
  const r = getRedis();
  const score = await r.zscore(NEWS_SORTED_KEY, id);
  return score !== null;
}
