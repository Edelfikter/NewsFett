import { XMLParser } from 'fast-xml-parser';

export interface RawFeedItem {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  publishedAt: number;
  guid?: string;
  geoLat?: number;
  geoLon?: number;
  source?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['item', 'entry'].includes(name),
});

// Strip all HTML tags iteratively until no tags remain
function stripHtml(raw: string): string {
  let s = raw;
  let prev: string;
  do {
    prev = s;
    s = s.replace(/<[^>]*>/g, '');
  } while (s !== prev);
  return s.trim();
}

function resolveDate(pubDate?: string): number {
  if (!pubDate) return Date.now();
  const d = new Date(pubDate);
  return isNaN(d.getTime()) ? Date.now() : d.getTime();
}

export async function fetchFeed(url: string): Promise<RawFeedItem[]> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': process.env.GEOCODE_USER_AGENT || 'NewsFett/1.0',
      Accept: 'application/rss+xml, application/atom+xml, text/xml, */*',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Feed fetch failed: ${res.status} ${url}`);
  }

  const text = await res.text();
  const data = parser.parse(text);

  const items: Omit<RawFeedItem, 'publishedAt'>[] = [];
  const sourceName = url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];

  // RSS 2.0
  const rssItems = data?.rss?.channel?.item || [];
  for (const item of Array.isArray(rssItems) ? rssItems : [rssItems]) {
    if (!item) continue;
    items.push({
      title: String(item.title || '').trim(),
      link: String(item.link || item.guid || '').trim(),
      description: stripHtml(String(item.description || '')),
      pubDate: item.pubDate || item['dc:date'],
      guid: item.guid?.['#text'] || item.guid || item.link,
      geoLat: item['geo:lat'] ? parseFloat(item['geo:lat']) : undefined,
      geoLon: item['geo:long'] ? parseFloat(item['geo:long']) : undefined,
      source: item.source?.['#text'] || item.source || sourceName,
    });
  }

  // Atom
  const atomEntries = data?.feed?.entry || [];
  for (const entry of Array.isArray(atomEntries) ? atomEntries : [atomEntries]) {
    if (!entry) continue;
    const link =
      (Array.isArray(entry.link)
        ? entry.link.find((l: { '@_rel'?: string }) => l['@_rel'] !== 'self')?.['@_href']
        : entry.link?.['@_href']) || '';
    items.push({
      title: String(entry.title?.['#text'] || entry.title || '').trim(),
      link,
      description: stripHtml(String(
        entry.summary?.['#text'] || entry.summary || entry.content?.['#text'] || entry.content || ''
      )),
      pubDate: entry.updated || entry.published,
      guid: entry.id || link,
      source: entry.source?.title || sourceName,
    });
  }

  return items
    .filter((it) => it.title && it.link)
    .map((it) => ({
      ...it,
      publishedAt: resolveDate(it.pubDate),
    }));
}

// Generate a stable dedupe ID
export function itemId(feedUrl: string, guid: string): string {
  const raw = `${feedUrl}::${guid}`;
  // Simple hash (djb2)
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash + raw.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash).toString(36);
}
