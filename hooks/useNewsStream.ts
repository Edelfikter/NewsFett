'use client';

import useSWR from 'swr';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { NewsItem } from '@/lib/redis';
import { MOCK_ITEMS } from '@/lib/mockData';

const POLL_INTERVAL = 12000; // 12s
const POPUP_DURATION = 12000; // 12s auto-dismiss
const SETTLE_DELAY = 20000; // 20s after page load before showing popups for real items

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface NewsItemWithUI extends NewsItem {
  showPopup: boolean;
  pinned: boolean;
}

export function useNewsStream() {
  const sinceRef = useRef<number>(Date.now() - 60 * 60 * 1000); // last hour
  const settledRef = useRef<boolean>(false);
  const [items, setItems] = useState<NewsItemWithUI[]>(() =>
    MOCK_ITEMS.map((it) => ({ ...it, showPopup: false, pinned: false }))
  );
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const timerMap = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const { data } = useSWR<NewsItem[]>(
    `/api/latest?since=${sinceRef.current}`,
    fetcher,
    { refreshInterval: POLL_INTERVAL, errorRetryCount: 3 }
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

      // Only show popups for real items after the settle delay has passed
      const showPopup = settledRef.current;

      const withUI: NewsItemWithUI[] = newOnes.map((it) => ({
        ...it,
        showPopup,
        pinned: false,
      }));

      if (showPopup) {
        // Schedule auto-dismiss for new items shown as popups
        withUI.forEach((item) => {
          const timer = setTimeout(() => {
            setItems((cur) =>
              cur.map((c) => (c.id === item.id && !c.pinned ? { ...c, showPopup: false } : c))
            );
            timerMap.current.delete(item.id);
          }, POPUP_DURATION);
          timerMap.current.set(item.id, timer);
        });
      }

      return [...withUI, ...prev].slice(0, 100);
    });
  }, [data]);

  const handleSetPinned = useCallback((id: string | null) => {
    setPinnedId(id);
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          // Clear auto-dismiss timer
          const t = timerMap.current.get(it.id);
          if (t) {
            clearTimeout(t);
            timerMap.current.delete(it.id);
          }
          return { ...it, pinned: true, showPopup: true };
        }
        if (it.pinned && id !== it.id) {
          return { ...it, pinned: false };
        }
        return it;
      })
    );
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

  return { items, pinnedId, setPinnedId: handleSetPinned, dismissPopup };
}
