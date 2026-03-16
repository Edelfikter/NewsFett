'use client';

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
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
}

export default function MapCanvas({ items, pinnedId, onPin }: Props) {
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

        {/* News markers – permanent dot for every item with location */}
        {items.map((item) => {
          const [px, py] = geoToPixel(item.lon, item.lat);
          const isPinned = item.id === pinnedId;
          return (
            <circle
              key={item.id}
              cx={px}
              cy={py}
              r={isPinned ? 6 : 4}
              fill="var(--marker-red)"
              stroke="#fff"
              strokeWidth={1.4}
              style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.35))' }}
            />
          );
        })}

        {/* Blip rings – animated expanding ring for newly arrived items */}
        {items.filter((it) => it.flashing).map((item) => {
          const [px, py] = geoToPixel(item.lon, item.lat);
          return (
            <circle key={`blip-${item.id}`} cx={px} cy={py} r={5} fill="none" stroke="var(--marker-red)" strokeWidth={2}>
              <animate attributeName="r" from="5" to="22" dur="1.8s" fill="freeze" />
              <animate attributeName="opacity" from="0.9" to="0" dur="1.8s" fill="freeze" />
            </circle>
          );
        })}
      </svg>
    </div>
  );
}
