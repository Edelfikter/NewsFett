'use client';

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';
import { geoEqualEarth } from 'd3-geo';
import Popup from './Popup';
import type { NewsItemWithUI } from '@/hooks/useNewsStream';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Dot grid configuration
const DOT_COLS = 72;
const DOT_ROWS = 36;
const DOT_R = 1.4;

type ProjectFn = (coord: [number, number]) => [number, number] | null;

function buildProjection(width: number, height: number): ProjectFn {
  const proj = geoEqualEarth()
    .translate([width / 2, height / 2])
    .scale(width / 6.5)
    .center([0, 10]);
  return (coord) => {
    const result = proj(coord);
    return result ? [result[0], result[1]] : null;
  };
}

function buildDotGrid(project: ProjectFn) {
  const dots: { cx: number; cy: number; key: string }[] = [];
  for (let row = 0; row < DOT_ROWS; row++) {
    for (let col = 0; col < DOT_COLS; col++) {
      const lon = -180 + (360 / DOT_COLS) * (col + 0.5);
      const lat = 85 - (170 / DOT_ROWS) * (row + 0.5);
      const projected = project([lon, lat]);
      if (projected) {
        dots.push({ cx: projected[0], cy: projected[1], key: `${col}-${row}` });
      }
    }
  }
  return dots;
}

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

  // Build projection and dot grid whenever dimensions change
  const project = useMemo(() => buildProjection(width, height), [width, height]);
  const dots = useMemo(() => buildDotGrid(project), [project]);

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
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: width / 6.5, center: [0, 10] }}
        width={width}
        height={height}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Country fills */}
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#0d2447"
                stroke="#1a3a6b"
                strokeWidth={0.4}
                style={{
                  default: { outline: 'none' },
                  hover: { outline: 'none' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {/* Dot grid */}
        {dots.map((dot) => (
          <circle
            key={dot.key}
            cx={dot.cx}
            cy={dot.cy}
            r={DOT_R}
            fill="#9ad37f"
            opacity={0.35}
          />
        ))}

        {/* News markers */}
        {activePopups.map((item) => {
          const pos = project([item.lon, item.lat]);
          if (!pos) return null;
          const isPinned = item.id === pinnedId;
          return (
            <Marker key={item.id} coordinates={[item.lon, item.lat]}>
              <circle
                r={isPinned ? 5 : 4}
                fill="#c7ff8b"
                opacity={isPinned ? 1 : 0.9}
                style={{ filter: `drop-shadow(0 0 ${isPinned ? 7 : 4}px #c7ff8b)` }}
              />
            </Marker>
          );
        })}
      </ComposableMap>

      {/* Popup overlays */}
      {activePopups.map((item) => {
        const pos = project([item.lon, item.lat]);
        if (!pos) return null;
        return (
          <Popup
            key={item.id}
            item={item}
            x={pos[0] / width}
            y={pos[1] / height}
            onDismiss={() => dismissPopup(item.id)}
            onPin={onPin}
          />
        );
      })}
    </div>
  );
}
