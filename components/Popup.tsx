'use client';

import { useEffect, useState } from 'react';
import type { NewsItemWithUI } from '@/hooks/useNewsStream';

interface Props {
  item: NewsItemWithUI;
  x: number; // SVG viewport x
  y: number; // SVG viewport y
  onDismiss: () => void;
  onPin: (id: string) => void;
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function Popup({ item, x, y, onDismiss, onPin }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Compute CSS left/top from SVG % coords
  // x, y are fractions 0–1 of the map container
  const style: React.CSSProperties = {
    left: `calc(${x * 100}% - 120px)`,
    top: `calc(${y * 100}% - 90px)`,
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(8px)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    pointerEvents: 'auto',
  };

  return (
    <div
      className="absolute z-30 w-60 glass rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.45)] border border-white/15"
      style={style}
    >
      {/* Connector dot */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-[#c7ff8b] shadow-[0_0_6px_#c7ff8b]"
      />

      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-bold tracking-widest uppercase text-[#9ad37f] bg-[#9ad37f]/10 px-1.5 py-0.5 rounded-sm">
            {item.source.replace(/^www\./, '').split('.')[0]}
          </span>
          <div className="flex items-center gap-1.5">
            {/* Pin */}
            <button
              onClick={() => onPin(item.id)}
              className={`text-[10px] transition-colors ${
                item.pinned ? 'text-[#c7ff8b]' : 'text-white/30 hover:text-white/60'
              }`}
              title={item.pinned ? 'Pinned' : 'Pin'}
            >
              {item.pinned ? '📌' : '⊙'}
            </button>
            {/* Close */}
            <button
              onClick={onDismiss}
              className="text-white/30 hover:text-white/80 transition-colors text-sm leading-none"
              title="Dismiss"
            >
              ×
            </button>
          </div>
        </div>

        {/* Headline */}
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs font-light leading-snug text-white/85 hover:text-white transition-colors line-clamp-3"
        >
          {item.title}
        </a>

        {/* Footer */}
        <div className="mt-2 text-[10px] text-white/30 font-bold tracking-wider">
          {timeAgo(item.publishedAt)}
        </div>
      </div>
    </div>
  );
}
