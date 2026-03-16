'use client';

import useSWR from 'swr';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { NewsItem } from '@/lib/redis';
import { MOCK_ITEMS } from '@/lib/mockData';

const POLL_INTERVAL = 12000; // 12s
const BLIP_DURATION = 1800; // 1.8s — matches the dot-blip CSS animation

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface NewsItemWithUI extends NewsItem {
  showPopup: boolean;
  pinned: boolean;
}

export function useNewsStream() {
  const sinceRef = useRef<number>(Date.now() - 60 * 60 * 1000); // last hour
  const [items, setItems] = useState<NewsItemWithUI[]>(() =>
    MOCK_ITEMS.map((it) => ({ ...it, showPopup: false, pinned: false }))
  );
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [blipIds, setBlipIds] = useState<Set<string>>(new Set());
  const timerMap = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const blipTimerMap = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const { data } = useSWR<NewsItem[]>(
    `/api/latest?since=${sinceRef.current}`,
    fetcher,
    { refreshInterval: POLL_INTERVAL, errorRetryCount: 3 }
  );

  useEffect(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return;

    // Update since to most recent item
    const maxTs = Math.max(...data.map((d) => d.publishedAt));
    if (maxTs > sinceRef.current) sinceRef.current = maxTs;

    setItems((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const newOnes = data.filter((d) => !existingIds.has(d.id));
      if (newOnes.length === 0) return prev;

      // New items go straight into the list — no auto-popup
      const withUI: NewsItemWithUI[] = newOnes.map((it) => ({
        ...it,
        showPopup: false,
        pinned: false,
      }));

      // Trigger a transient red blip for each new item's dot
      withUI.forEach((item) => {
        setBlipIds((prev) => new Set(prev).add(item.id));

        // Clear any existing blip timer for this id
        const existing = blipTimerMap.current.get(item.id);
        if (existing) clearTimeout(existing);

        const t = setTimeout(() => {
          setBlipIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
          blipTimerMap.current.delete(item.id);
        }, BLIP_DURATION);
        blipTimerMap.current.set(item.id, t);
      });

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

  return { items, blipIds, pinnedId, setPinnedId: handleSetPinned, dismissPopup };
}
