'use client';

import useSWR from 'swr';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { NewsItem } from '@/lib/redis';
import { MOCK_ITEMS } from '@/lib/mockData';
import { getLocalFeeds } from '@/lib/localFeeds';

const POLL_INTERVAL = 12000; // 12s
const BLIP_DURATION = 2000; // 2s flash on map for new items
const SETTLE_DELAY = 20000; // 20s after page load before flashing new real items

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const userFeedsFetcher = ([, feeds]: [string, string[]]) => {
  return fetch('/api/user-feeds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feeds }),
  }).then((r) => r.json());
};

export interface NewsItemWithUI extends NewsItem {
  flashing: boolean;
}

export function useNewsStream() {
  const sinceRef = useRef<number>(Date.now() - 60 * 60 * 1000); // last hour
  const settledRef = useRef<boolean>(false);
  const [items, setItems] = useState<NewsItemWithUI[]>(() =>
    MOCK_ITEMS.map((it) => ({ ...it, flashing: false }))
  );
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  // Local (device-scoped) feeds – stored in localStorage, never sent to the global store
  const [localFeeds, setLocalFeeds] = useState<string[]>([]);

  // Read local feeds from localStorage once on mount (client only)
  useEffect(() => {
    setLocalFeeds(getLocalFeeds());
  }, []);

  // Allows components to trigger a refresh when a new local feed is added
  const refreshLocalFeeds = useCallback(() => {
    setLocalFeeds(getLocalFeeds());
  }, []);

  const { data } = useSWR<NewsItem[]>(
    `/api/latest?since=${sinceRef.current}`,
    fetcher,
    { refreshInterval: POLL_INTERVAL, errorRetryCount: 3 }
  );

  // Poll user-added (device-local) feeds independently using the proxy endpoint
  const userFeedsSWRKey: [string, string[]] | null =
    localFeeds.length > 0 ? ['/api/user-feeds', localFeeds] : null;

  const { data: userFeedsData } = useSWR<NewsItem[]>(
    userFeedsSWRKey,
    userFeedsFetcher,
    { refreshInterval: POLL_INTERVAL, errorRetryCount: 2 }
  );

  // Mark user as "settled" after SETTLE_DELAY ms; only then will new real items show popups
  useEffect(() => {
    const timer = setTimeout(() => {
      settledRef.current = true;
    }, SETTLE_DELAY);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return;

    // Update since to most recent item
    const maxTs = Math.max(...data.map((d) => d.publishedAt));
    if (maxTs > sinceRef.current) sinceRef.current = maxTs;

    setItems((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const newOnes = data.filter((d) => !existingIds.has(d.id));
      if (newOnes.length === 0) return prev;

      // Only flash for real items after the settle delay has passed
      const shouldFlash = settledRef.current;

      const withUI: NewsItemWithUI[] = newOnes.map((it) => ({
        ...it,
        flashing: shouldFlash,
      }));

      if (shouldFlash) {
        // Schedule clearing the flash flag after BLIP_DURATION
        withUI.forEach((item) => {
          setTimeout(() => {
            setItems((cur) =>
              cur.map((c) => (c.id === item.id ? { ...c, flashing: false } : c))
            );
          }, BLIP_DURATION);
        });
      }

      return [...withUI, ...prev].slice(0, 100);
    });
  }, [data]);

  useEffect(() => {
    if (!userFeedsData || !Array.isArray(userFeedsData) || userFeedsData.length === 0) return;

    setItems((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const newOnes = userFeedsData.filter((d) => !existingIds.has(d.id));
      if (newOnes.length === 0) return prev;

      const withUI: NewsItemWithUI[] = newOnes.map((it) => ({
        ...it,
        showPopup: false,
        pinned: false,
      }));

      return [...withUI, ...prev].slice(0, 100);
    });
  }, [userFeedsData]);

  const handleSetPinned = useCallback((id: string | null) => {
    setPinnedId(id);
  }, []);

  const dismissPopup = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, showPopup: false, pinned: false } : it))
    );
    setPinnedId((cur) => (cur === id ? null : cur));
    const t = timerMap.current.get(id);
    if (t) {
      clearTimeout(t);
      timerMap.current.delete(id);
    }
  }, []);

  return { items, pinnedId, setPinnedId: handleSetPinned, dismissPopup, refreshLocalFeeds };
}
