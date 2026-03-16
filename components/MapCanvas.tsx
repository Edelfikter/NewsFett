'use client';

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import Popup from './Popup';
import type { NewsItemWithUI } from '@/hooks/useNewsStream';
import { WORLD_MASK, MASK_COLS, MASK_ROWS, geoToFraction } from '@/lib/worldMask';

// Dot grid sizing — matches the 72 × 36 mask
const DOT_COLS = MASK_COLS;
const DOT_ROWS = MASK_ROWS;
const DOT_MARGIN = 0.18; // fraction of cell size used as margin between adjacent dots

interface Props {
  items: NewsItemWithUI[];
  pinnedId: string | null;
  onPin: (id: string | null) => void;
  onDismiss: (id: string) => void;
}

export default function MapCanvas({ items, pinnedId, onPin, onDismiss }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Measure container
  useEffect(() => {
    const observe = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    observe();
    const ro = new ResizeObserver(observe);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const { width, height } = dimensions;

  // Cell size in pixels
  const cellW = width / DOT_COLS;
  const cellH = height / DOT_ROWS;
  // Dot rendered size: leave a small margin between cells
  const dotW = Math.max(1.5, cellW * (1 - DOT_MARGIN));
  const dotH = Math.max(1.5, cellH * (1 - DOT_MARGIN));

  // Build land-dot list from the fixed pixel mask (no projection distortion)
  const dots = useMemo(() => {
    const out: { x: number; y: number; key: string }[] = [];
    for (let r = 0; r < DOT_ROWS; r++) {
      const row = WORLD_MASK[r];
      for (let c = 0; c < DOT_COLS; c++) {
        if (row[c] === '1') {
          out.push({
            x: (c + 0.5) * cellW,
            y: (r + 0.5) * cellH,
            key: `${c}-${r}`,
          });
        }
      }
    }
    return out;
  }, [cellW, cellH]);

  // Convert lon/lat → pixel position using the same equirectangular mapping
  const geoToPixel = useCallback(
    (lon: number, lat: number): [number, number] => {
      const [fx, fy] = geoToFraction(lon, lat);
      return [fx * width, fy * height];
    },
    [width, height]
  );

  // Dismiss popup - delegate to parent which handles state
  const dismissPopup = useCallback(
    (id: string) => {
      onDismiss(id);
    },
    [onDismiss]
  );

  // Active popups
  const activePopups = useMemo(
    () => items.filter((it) => it.showPopup),
    [items]
  );

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg
        width={width}
        height={height}
        style={{ display: 'block', width: '100%', height: '100%' }}
        aria-label="World news map"
      >
        {/* Land dot grid – square rects, placed with equirectangular mapping */}
        {dots.map((dot) => (
          <rect
            key={dot.key}
            x={dot.x - dotW / 2}
            y={dot.y - dotH / 2}
            width={dotW}
            height={dotH}
            rx={Math.min(dotW, dotH) * DOT_MARGIN}
            fill="var(--dot-base)"
            opacity={0.78}
          />
        ))}

        {/* News markers – red circle with white stroke/glow */}
        {activePopups.map((item) => {
          const [px, py] = geoToPixel(item.lon, item.lat);
          const isPinned = item.id === pinnedId;
          return (
            <circle
              key={item.id}
              cx={px}
              cy={py}
              r={isPinned ? 6 : 5}
              fill="var(--marker-red)"
              stroke="#fff"
              strokeWidth={1.6}
              style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.45))' }}
            />
          );
        })}
      </svg>

      {/* Popup overlays */}
      {activePopups.map((item) => {
        const [fx, fy] = geoToFraction(item.lon, item.lat);
        return (
          <Popup
            key={item.id}
            item={item}
            x={fx}
            y={fy}
            onDismiss={() => dismissPopup(item.id)}
            onPin={onPin}
          />
        );
      })}
    </div>
  );
}
