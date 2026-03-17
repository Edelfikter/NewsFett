const LOCAL_FEEDS_KEY = 'newsfett:user-feeds';

/** Result of trying to add a local feed. */
export type AddFeedResult = 'added' | 'duplicate' | 'error';

/**
 * Returns the list of user-added feed URLs stored in this browser's localStorage.
 * Returns an empty array when called outside a browser context (SSR).
 */
export function getLocalFeeds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_FEEDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * Adds a feed URL to localStorage.
 * Returns `'added'` when the feed was newly stored,
 * `'duplicate'` when it was already present, or `'error'` on failure.
 */
export function addLocalFeed(url: string): AddFeedResult {
  if (typeof window === 'undefined') return 'error';
  try {
    const feeds = getLocalFeeds();
    if (feeds.includes(url)) return 'duplicate';
    feeds.push(url);
    localStorage.setItem(LOCAL_FEEDS_KEY, JSON.stringify(feeds));
    return 'added';
  } catch {
    return 'error';
  }
}

/**
 * Removes a feed URL from localStorage.
 */
export function removeLocalFeed(url: string): void {
  if (typeof window === 'undefined') return;
  try {
    const feeds = getLocalFeeds().filter((f) => f !== url);
    localStorage.setItem(LOCAL_FEEDS_KEY, JSON.stringify(feeds));
  } catch {
    // ignore
  }
}
