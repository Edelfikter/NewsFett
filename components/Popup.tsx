'use client';

import { useEffect, useState } from 'react';
import type { NewsItemWithUI } from '@/hooks/useNewsStream';

interface Props {
  item: NewsItemWithUI;
  x: number; // fraction 0–1 of map container width
  y: number; // fraction 0–1 of map container height
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

  const sourceName = (item.source.replace(/^www\./, '').split('.')[0] || item.source).toUpperCase();

  const style: React.CSSProperties = {
    left: `calc(${x * 100}% - 148px)`,
    top: `calc(${y * 100}% - 80px)`,
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(8px)',
    transition: 'opacity 0.25s ease, transform 0.25s ease',
    pointerEvents: 'auto',
  };

  return (
    <div className="absolute z-30" style={style}>
      {/* Bubble chain – three diminishing red circles on the left */}
      <div className="absolute -left-7 top-10 flex flex-col gap-1.5 items-center">
        <span className="block w-3.5 h-3.5 rounded-full bg-[var(--marker-red)] border-2 border-white/70 shadow-sm" />
        <span className="block w-2.5 h-2.5 rounded-full bg-[var(--marker-red)] border border-white/60 shadow-sm" />
        <span className="block w-1.5 h-1.5 rounded-full bg-[var(--marker-red)] border border-white/50" />
      </div>

      {/* Pill outer (red) */}
      <div
        className="relative min-w-[296px] max-w-[320px] rounded-[22px] border-2 border-white shadow-[0_14px_36px_rgba(0,0,0,0.6)]"
        style={{ background: 'var(--marker-red)' }}
      >
        {/* White inner panel */}
        <div className="bg-white/96 text-[#111] rounded-[18px] m-[5px] px-4 py-3 leading-tight">
          {/* Source label */}
          <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--marker-orange)' }}>
            {sourceName}
          </div>

          {/* Headline */}
          <div className="text-[15px] font-bold leading-snug mb-2 line-clamp-3">
            {item.title}
          </div>

          {/* Article link */}
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold underline"
            style={{ color: '#0d4fa3', textDecorationColor: 'var(--marker-orange)' }}
          >
            Open article ↗
          </a>
        </div>

        {/* Footer bar inside the red pill */}
        <div className="flex items-center justify-between px-4 pb-2.5 pt-0.5 text-[10px] text-white/85 font-bold tracking-wide">
          <span>{timeAgo(item.publishedAt)}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPin(item.id)}
              className="text-white hover:text-yellow-200 transition-colors"
              title={item.pinned ? 'Pinned' : 'Pin'}
              aria-label={item.pinned ? 'Pinned' : 'Pin article'}
            >
              {item.pinned ? '📌' : '⊙'}
            </button>
            <button
              onClick={onDismiss}
              className="text-white/75 hover:text-white transition-colors text-base leading-none"
              title="Dismiss"
              aria-label="Dismiss popup"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
